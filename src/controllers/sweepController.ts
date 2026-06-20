import { Request, Response } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '../generated/client/client';
import { coinbaseService } from '../services/coinbaseService';
import { vault } from '../services/vaultService';

/**
 * Sweep Controller — AgentKin Owner Dashboard
 * Password-protected manual fund sweep to Coinbase.
 * Password is stored as SHA-256 hash — never plaintext.
 *
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

// @ts-ignore
const prisma = new PrismaClient({});

// Hash function — SHA-256 with app salt from env
function hashPassword(password: string): string {
    const salt = process.env.SWEEP_PASSWORD_SALT || 'agentkin-vault-salt';
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Verify submitted password against stored hash
async function verifyPassword(submitted: string): Promise<boolean> {
    try {
        const storedHash = await vault.get('SWEEP_PASSWORD_HASH');
        const submittedHash = hashPassword(submitted);
        // Constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(storedHash, 'hex'),
            Buffer.from(submittedHash, 'hex')
        );
    } catch {
        // If no password is set in vault yet, fall back to env
        const envHash = process.env.SWEEP_PASSWORD_HASH;
        if (!envHash) return false;
        const submittedHash = hashPassword(submitted);
        return crypto.timingSafeEqual(
            Buffer.from(envHash, 'hex'),
            Buffer.from(submittedHash, 'hex')
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sweep/authorize
// Verifies password and returns a short-lived sweep token
// ─────────────────────────────────────────────────────────────────────────────
export const authorizeSweep = async (req: Request, res: Response): Promise<void> => {
    const { password } = req.body;

    if (!password) {
        res.status(400).json({ success: false, error: 'Password required' });
        return;
    }

    const valid = await verifyPassword(password);
    if (!valid) {
        // Log failed attempt
        console.warn(`[Sweep] Failed authorization attempt at ${new Date().toISOString()}`);
        res.status(401).json({ success: false, error: 'Invalid sweep password' });
        return;
    }

    // Issue a short-lived one-time token (valid 5 minutes)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Store token in-memory (single use)
    sweepTokenStore.set(token, expiresAt);

    // Get current Coinbase balances so user can review before confirming
    let accounts: any = null;
    try {
        accounts = await coinbaseService.listAccounts();
    } catch (err: any) {
        console.warn('[Sweep] Could not fetch balances:', err.message);
    }

    res.status(200).json({
        success: true,
        sweepToken: token,
        expiresInSeconds: 300,
        message: 'Password verified. Use sweepToken to confirm the sweep within 5 minutes.',
        preview: accounts,
    });
};

// In-memory one-time token store
const sweepTokenStore = new Map<string, number>();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sweep/execute
// Executes the sweep using the one-time token
// Body: { sweepToken, accountId, currency, amount }
// ─────────────────────────────────────────────────────────────────────────────
export const executeSweep = async (req: Request, res: Response): Promise<void> => {
    const { sweepToken, accountId, currency, amount } = req.body;

    if (!sweepToken) {
        res.status(400).json({ success: false, error: 'sweepToken required' });
        return;
    }

    // Validate token
    const expiresAt = sweepTokenStore.get(sweepToken);
    if (!expiresAt || Date.now() > expiresAt) {
        sweepTokenStore.delete(sweepToken);
        res.status(401).json({ success: false, error: 'Sweep token expired or invalid. Re-authorize.' });
        return;
    }

    // One-time use — delete immediately
    sweepTokenStore.delete(sweepToken);

    if (!accountId || !currency || !amount) {
        res.status(400).json({ success: false, error: 'accountId, currency, and amount are required' });
        return;
    }

    const validCurrencies = ['XRP', 'BTC', 'SOL', 'BNB'];
    if (!validCurrencies.includes(currency)) {
        res.status(400).json({ success: false, error: `currency must be one of: ${validCurrencies.join(', ')}` });
        return;
    }

    try {
        const wallets = await vault.getOwnerWallets();
        const wallet = wallets[currency as keyof typeof wallets];

        if (!wallet.address) {
            res.status(400).json({ success: false, error: `No owner wallet address configured for ${currency}` });
            return;
        }

        // Execute the Coinbase withdrawal
        const result = await coinbaseService.withdrawToOwnerWallet(
            accountId,
            currency as 'XRP' | 'BTC' | 'SOL' | 'BNB',
            amount
        );

        // Log the sweep in the Transaction table
        await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                type: 'WITHDRAWAL',
                provider: 'COINBASE',
                currency,
                toAddress: wallet.address,
                memo: currency === 'XRP' ? (wallets.XRP as any).memo : null,
                status: 'PROCESSED',
                authorizedAt: new Date(),
                agentSignature: 'OWNER_SWEEP',
                // System-level: no userId for owner sweep (use a system user or skip)
                userId: process.env.OWNER_USER_ID || 'system',
            },
        });

        console.log(`[Sweep] ✅ Swept ${amount} ${currency} to ${wallet.address} at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: `Swept ${amount} ${currency} to your ${currency} wallet`,
            destination: wallet.address,
            coinbaseResult: result,
        });

    } catch (error: any) {
        console.error('[Sweep] executeSweep error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sweep/history
// Returns past sweep transactions
// ─────────────────────────────────────────────────────────────────────────────
export const getSweepHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const history = await prisma.transaction.findMany({
            where: { agentSignature: 'OWNER_SWEEP' },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.status(200).json({ success: true, history });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
