import { Router } from 'express';
import { authorizePayment } from '../controllers/transactionController';

const router = Router();

// Agent Commerce Protocol (ACP)
router.post('/authorize', authorizePayment);

export default router;
