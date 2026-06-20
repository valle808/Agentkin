import { Router } from 'express';
import { authorizeSweep, executeSweep, getSweepHistory } from '../controllers/sweepController';

/**
 * Sweep Routes — AgentKin Owner Dashboard
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

const router = Router();

// Step 1: Enter password → get one-time sweep token
router.post('/authorize', authorizeSweep);

// Step 2: Confirm sweep with token
router.post('/execute', executeSweep);

// View sweep history
router.get('/history', getSweepHistory);

export default router;
