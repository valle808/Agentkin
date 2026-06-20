import express from 'express';
import { runContinuousSmartAgent } from './scripts/smart-trade-agent';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'AgentKin Neural Backup Server is ACTIVE',
    timestamp: new Date().toISOString()
  });
});

app.get('/ledger', (req, res) => {
  try {
    const ledger = require('./data/neural_ledger.json');
    res.json(ledger);
  } catch {
    res.json({ error: 'Ledger not found or empty.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AgentKin Neural Backup Server running on http://localhost:${PORT}`);
  console.log(`Starting the Smart Trading Swarm background process...`);
  runContinuousSmartAgent();
});
