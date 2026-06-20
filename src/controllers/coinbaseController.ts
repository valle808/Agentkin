import { Request, Response } from 'express';
import { coinbaseService, OWNER_WALLETS } from '../services/coinbaseService';

/**
 * Coinbase Controller — AgentKin
 * Handles portfolio management, trading, and owner wallet withdrawals.
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

// GET /api/coinbase/accounts
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await coinbaseService.listAccounts();
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[Coinbase] getAccounts error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/coinbase/portfolio
export const getPortfolio = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await coinbaseService.getPortfolio();
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[Coinbase] getPortfolio error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/coinbase/price/:productId
export const getPrice = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const data = await coinbaseService.getBestBidAsk([productId]);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[Coinbase] getPrice error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /api/coinbase/orders/buy
// Body: { productId: 'BTC-USD', quoteSize: '10.00' }
export const placeBuyOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, quoteSize } = req.body;
        if (!productId || !quoteSize) {
            res.status(400).json({ success: false, error: 'productId and quoteSize are required' });
            return;
        }
        const data = await coinbaseService.marketBuy(productId, quoteSize);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[Coinbase] placeBuyOrder error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /api/coinbase/orders/sell
// Body: { productId: 'BTC-USD', baseSize: '0.001' }
export const placeSellOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, baseSize } = req.body;
        if (!productId || !baseSize) {
            res.status(400).json({ success: false, error: 'productId and baseSize are required' });
            return;
        }
        const data = await coinbaseService.marketSell(productId, baseSize);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[Coinbase] placeSellOrder error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/coinbase/orders
export const listOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = req.query.productId as string | undefined;
        const data = await coinbaseService.listOrders(productId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[Coinbase] listOrders error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// DELETE /api/coinbase/orders/:orderId
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const data = await coinbaseService.cancelOrder(orderId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[Coinbase] cancelOrder error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/coinbase/wallets
// Returns configured owner wallet addresses (no private data)
export const getOwnerWallets = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
        success: true,
        wallets: {
            XRP: { address: OWNER_WALLETS.XRP.address, memo: OWNER_WALLETS.XRP.memo },
            BTC: { address: OWNER_WALLETS.BTC.address },
            SOL: { address: OWNER_WALLETS.SOL.address },
            BNB: { address: OWNER_WALLETS.BNB.address },
        },
    });
};

// POST /api/coinbase/withdraw
// Body: { accountId: string, currency: 'XRP'|'BTC'|'SOL'|'BNB', amount: string }
export const withdrawToOwner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { accountId, currency, amount } = req.body;

        if (!accountId || !currency || !amount) {
            res.status(400).json({ success: false, error: 'accountId, currency, and amount are required' });
            return;
        }

        const validCurrencies = ['XRP', 'BTC', 'SOL', 'BNB'];
        if (!validCurrencies.includes(currency)) {
            res.status(400).json({ success: false, error: `currency must be one of: ${validCurrencies.join(', ')}` });
            return;
        }

        const data = await coinbaseService.withdrawToOwnerWallet(accountId, currency, amount);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('[Coinbase] withdrawToOwner error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
