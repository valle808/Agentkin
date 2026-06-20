import { Router } from 'express';
import {
    getAccounts,
    getPortfolio,
    getPrice,
    placeBuyOrder,
    placeSellOrder,
    listOrders,
    cancelOrder,
    getOwnerWallets,
    withdrawToOwner,
} from '../controllers/coinbaseController';

/**
 * Coinbase Routes — AgentKin
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

const router = Router();

// ─── Portfolio & Accounts ────────────────────────────────────
router.get('/accounts', getAccounts);
router.get('/portfolio', getPortfolio);
router.get('/price/:productId', getPrice);

// ─── Trading ─────────────────────────────────────────────────
router.post('/orders/buy', placeBuyOrder);
router.post('/orders/sell', placeSellOrder);
router.get('/orders', listOrders);
router.delete('/orders/:orderId', cancelOrder);

// ─── Owner Wallet Management ──────────────────────────────────
router.get('/wallets', getOwnerWallets);
router.post('/withdraw', withdrawToOwner);

export default router;
