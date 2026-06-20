import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import transactionRoutes from './routes/transactionRoutes';
import coinbaseRoutes from './routes/coinbaseRoutes';
import sweepRoutes from './routes/sweepRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'AgentKin API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/kintasks', taskRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/coinbase', coinbaseRoutes);
app.use('/api/sweep', sweepRoutes);

// Error Handling
app.use(errorHandler);

export default app;

# Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
