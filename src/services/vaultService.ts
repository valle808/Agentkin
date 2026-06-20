import crypto from 'crypto';
import { PrismaClient } from '../generated/client/client';

/**
 * AgentKin Secrets Vault Service
 * --------------------------------
 * Stores all API keys, private keys, and wallet addresses in the database,
 * encrypted with AES-256-GCM using a master key from the environment.
 *
 * Architecture:
 *   - Only ONE secret lives outside the DB: VAULT_MASTER_KEY (32-byte hex string)
 *   - All other secrets are encrypted and stored in the EncryptedSecret table
 *   - Values are cached in-memory after first load (process lifetime)
 *   - The entire AgentKin ecosystem calls vault.get('KEY_NAME') to retrieve any secret
 *
 * Setup:
 *   1. Add VAULT_MASTER_KEY=<64-char hex> to your .env
 *   2. Run: npx ts-node scripts/seed-vault.ts   (seeds your secrets on first run)
 *   3. Everything else calls vault.get() — no more .env needed for individual keys
 *
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

// @ts-ignore
const prisma = new PrismaClient({});

const ALGORITHM = 'aes-256-gcm';

function getMasterKey(): Buffer {
    const key = process.env.VAULT_MASTER_KEY;
    if (!key || key.length !== 64) {
        throw new Error(
            'VAULT_MASTER_KEY must be set in .env as a 64-character hex string (32 bytes). ' +
            'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    return Buffer.from(key, 'hex');
}

function encrypt(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        ciphertext: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
    };
}

function decrypt(ciphertext: string, iv: string, authTag: string): string {
    const masterKey = getMasterKey();
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        masterKey,
        Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}

// ─── In-memory cache (per process lifetime) ──────────────────────────────────
const secretCache = new Map<string, string>();

// ─── Public Vault API ─────────────────────────────────────────────────────────

export const vault = {

    /**
     * Retrieve a secret by key name.
     * Returns from cache if already loaded, otherwise decrypts from DB.
     */
    async get(key: string): Promise<string> {
        if (secretCache.has(key)) {
            return secretCache.get(key)!;
        }

        const record = await prisma.encryptedSecret.findUnique({ where: { key } });
        if (!record) {
            throw new Error(
                `Secret "${key}" not found in vault. ` +
                'Run: npx ts-node scripts/seed-vault.ts'
            );
        }

        const value = decrypt(record.ciphertext, record.iv, record.authTag);
        secretCache.set(key, value);
        return value;
    },

    /**
     * Store or update a secret in the vault (encrypted).
     * Use this from the seed script or admin endpoints.
     */
    async set(
        key: string,
        plaintext: string,
        category = 'GENERAL',
        description?: string
    ): Promise<void> {
        const { ciphertext, iv, authTag } = encrypt(plaintext);
        await prisma.encryptedSecret.upsert({
            where: { key },
            create: { key, ciphertext, iv, authTag, category, description },
            update: { ciphertext, iv, authTag, category, description },
        });
        // Invalidate cache on update
        secretCache.delete(key);
    },

    /**
     * Delete a secret from the vault.
     */
    async delete(key: string): Promise<void> {
        await prisma.encryptedSecret.delete({ where: { key } });
        secretCache.delete(key);
    },

    /**
     * List all secret keys (not values) in a category.
     */
    async list(category?: string): Promise<{ key: string; category: string; description: string | null; updatedAt: Date }[]> {
        return prisma.encryptedSecret.findMany({
            where: category ? { category } : undefined,
            select: { key: true, category: true, description: true, updatedAt: true },
            orderBy: { category: 'asc' },
        });
    },

    /**
     * Pre-warm the cache by loading all secrets at startup.
     * Call this in index.ts before the server starts.
     */
    async warmCache(): Promise<void> {
        const records = await prisma.encryptedSecret.findMany();
        for (const record of records) {
            try {
                const value = decrypt(record.ciphertext, record.iv, record.authTag);
                secretCache.set(record.key, value);
            } catch {
                console.warn(`[Vault] Could not decrypt secret "${record.key}" — skipping.`);
            }
        }
        console.log(`[Vault] Cache warmed with ${secretCache.size} secrets.`);
    },

    /**
     * Get owner wallet configuration from vault.
     * Used by coinbaseService as the canonical source of wallet addresses.
     */
    async getOwnerWallets() {
        const [xrpAddress, xrpMemo, btcAddress, solAddress, bnbAddress] = await Promise.all([
            vault.get('OWNER_XRP_ADDRESS').catch(() => ''),
            vault.get('OWNER_XRP_MEMO').catch(() => ''),
            vault.get('OWNER_BTC_ADDRESS').catch(() => ''),
            vault.get('OWNER_SOL_ADDRESS').catch(() => ''),
            vault.get('OWNER_BNB_ADDRESS').catch(() => ''),
        ]);
        return {
            XRP: { address: xrpAddress, memo: xrpMemo },
            BTC: { address: btcAddress },
            SOL: { address: solAddress },
            BNB: { address: bnbAddress },
        };
    },
};
