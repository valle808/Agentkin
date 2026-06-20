/**
 * AgentKin — Vercel Serverless Entry Point
 * Routes all /api/* requests through the Express app.
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const prisma = new PrismaClient();
const ALGORITHM = 'aes-256-gcm';

// ─── Vault helpers ────────────────────────────────────────────────────────────
function getMasterKey() {
    const key = process.env.VAULT_MASTER_KEY;
    if (!key || key.length !== 64) throw new Error('VAULT_MASTER_KEY not configured');
    return Buffer.from(key, 'hex');
}

function encrypt(plaintext) {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { ciphertext: encrypted.toString('base64'), iv: iv.toString('base64'), authTag: authTag.toString('base64') };
}

function decrypt(ciphertext, iv, authTag) {
    const masterKey = getMasterKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

const secretCache = new Map();

async function vaultGet(key) {
    if (secretCache.has(key)) return secretCache.get(key);
    const record = await prisma.encryptedSecret.findUnique({ where: { key } });
    if (!record) throw new Error(`Secret "${key}" not found in vault`);
    const value = decrypt(record.ciphertext, record.iv, record.authTag);
    secretCache.set(key, value);
    return value;
}

function hashPassword(password) {
    const salt = process.env.SWEEP_PASSWORD_SALT || 'agentkin-vault-salt';
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// One-time sweep tokens
const sweepTokenStore = new Map();

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AgentKin API is running', vault: 'AES-256-GCM' });
});

// ─── Vault: list secrets (keys only, no values) ───────────────────────────────
app.get('/api/vault/list', async (req, res) => {
    try {
        const secrets = await prisma.encryptedSecret.findMany({
            select: { key: true, category: true, description: true, updatedAt: true },
            orderBy: { category: 'asc' }
        });
        res.json({ success: true, count: secrets.length, secrets });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─── Coinbase: accounts ───────────────────────────────────────────────────────
app.get('/api/coinbase/accounts', async (req, res) => {
    try {
        const apiKeyName = await vaultGet('COINBASE_API_KEY_NAME');
        const privateKeyRaw = await vaultGet('COINBASE_PRIVATE_KEY');
        const data = await coinbaseRequest('GET', '/api/v3/brokerage/accounts', null, apiKeyName, privateKeyRaw);
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─── Coinbase: portfolio ──────────────────────────────────────────────────────
app.get('/api/coinbase/portfolio', async (req, res) => {
    try {
        const apiKeyName = await vaultGet('COINBASE_API_KEY_NAME');
        const privateKeyRaw = await vaultGet('COINBASE_PRIVATE_KEY');
        const data = await coinbaseRequest('GET', '/api/v3/brokerage/portfolios', null, apiKeyName, privateKeyRaw);
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─── Coinbase: wallets ────────────────────────────────────────────────────────
app.get('/api/coinbase/wallets', async (req, res) => {
    try {
        const [xrpAddress, xrpMemo, btcAddress, solAddress, bnbAddress] = await Promise.all([
            vaultGet('OWNER_XRP_ADDRESS').catch(() => ''),
            vaultGet('OWNER_XRP_MEMO').catch(() => ''),
            vaultGet('OWNER_BTC_ADDRESS').catch(() => ''),
            vaultGet('OWNER_SOL_ADDRESS').catch(() => ''),
            vaultGet('OWNER_BNB_ADDRESS').catch(() => ''),
        ]);
        res.json({ success: true, wallets: {
            XRP: { address: xrpAddress, memo: xrpMemo },
            BTC: { address: btcAddress },
            SOL: { address: solAddress },
            BNB: { address: bnbAddress },
        }});
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─── Sweep: authorize (password → one-time token) ────────────────────────────
app.post('/api/sweep/authorize', async (req, res) => {
    const { password } = req.body;
    if (!password) { res.status(400).json({ success: false, error: 'Password required' }); return; }

    try {
        const storedHash = await vaultGet('SWEEP_PASSWORD_HASH');
        const submittedHash = hashPassword(password);
        const valid = crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(submittedHash, 'hex'));

        if (!valid) {
            console.warn(`[Sweep] Failed auth attempt at ${new Date().toISOString()}`);
            res.status(401).json({ success: false, error: 'Invalid sweep password' });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        sweepTokenStore.set(token, Date.now() + 5 * 60 * 1000);

        let accounts = null;
        try {
            const apiKeyName = await vaultGet('COINBASE_API_KEY_NAME');
            const privateKeyRaw = await vaultGet('COINBASE_PRIVATE_KEY');
            accounts = await coinbaseRequest('GET', '/api/v3/brokerage/accounts', null, apiKeyName, privateKeyRaw);
        } catch {}

        res.json({ success: true, sweepToken: token, expiresInSeconds: 300, preview: accounts });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─── Sweep: execute ───────────────────────────────────────────────────────────
app.post('/api/sweep/execute', async (req, res) => {
    const { sweepToken, accountId, currency, amount } = req.body;

    const expiresAt = sweepTokenStore.get(sweepToken);
    if (!expiresAt || Date.now() > expiresAt) {
        sweepTokenStore.delete(sweepToken);
        res.status(401).json({ success: false, error: 'Sweep token expired or invalid. Re-authorize.' });
        return;
    }
    sweepTokenStore.delete(sweepToken);

    if (!accountId || !currency || !amount) {
        res.status(400).json({ success: false, error: 'accountId, currency, and amount are required' });
        return;
    }

    try {
        const walletKey = `OWNER_${currency}_ADDRESS`;
        const destAddress = await vaultGet(walletKey);
        const memo = currency === 'XRP' ? await vaultGet('OWNER_XRP_MEMO').catch(() => '') : null;

        const apiKeyName = await vaultGet('COINBASE_API_KEY_NAME');
        const privateKeyRaw = await vaultGet('COINBASE_PRIVATE_KEY');

        const body = { type: 'send', to: destAddress, amount, currency };
        if (memo) body.destination_tag = memo;

        const result = await coinbaseRequest('POST', `/v2/accounts/${accountId}/transactions`, body, apiKeyName, privateKeyRaw);

        console.log(`[Sweep] ✅ ${amount} ${currency} → ${destAddress}`);
        res.json({ success: true, message: `Swept ${amount} ${currency} to your ${currency} wallet`, destination: destAddress, result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─── Sweep: history ───────────────────────────────────────────────────────────
app.get('/api/sweep/history', async (req, res) => {
    try {
        // Return vault secret list as a proxy for activity
        const secrets = await prisma.encryptedSecret.findMany({
            select: { key: true, category: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ success: true, history: [], vaultStatus: `${secrets.length} secrets secured` });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─── Coinbase JWT helper ──────────────────────────────────────────────────────
const https = require('https');

function buildJWT(method, path, apiKeyName, privateKeyRaw) {
    const privateKeyPem = privateKeyRaw.replace(/\\n/g, '\n');
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: apiKeyName, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
        sub: apiKeyName, iss: 'coinbase-cloud', nbf: now, exp: now + 120,
        uri: `${method} api.coinbase.com${path}`,
    })).toString('base64url');
    const signingInput = `${header}.${payload}`;
    const sign = crypto.createSign('SHA256');
    sign.update(signingInput);
    const signature = sign.sign({ key: privateKeyPem, dsaEncoding: 'ieee-p1363' }, 'base64url');
    return `${signingInput}.${signature}`;
}

function coinbaseRequest(method, path, body, apiKeyName, privateKeyRaw) {
    return new Promise((resolve, reject) => {
        const jwt = buildJWT(method, path, apiKeyName, privateKeyRaw);
        const bodyStr = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'api.coinbase.com', path, method,
            headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
        };
        const req = https.request(options, (res2) => {
            let data = '';
            res2.on('data', c => data += c);
            res2.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res2.statusCode >= 400) reject(new Error(`Coinbase ${res2.statusCode}: ${JSON.stringify(parsed)}`));
                    else resolve(parsed);
                } catch { reject(new Error(`Bad response: ${data}`)); }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

module.exports = app;
