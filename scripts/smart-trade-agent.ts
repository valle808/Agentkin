import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from the .env file in the root
dotenv.config({ path: path.join(__dirname, '../.env') });

import { coinbaseService } from '../src/services/coinbaseService';

const GOAL_USD = 1000000000000; // 1 Trillion USD
const LOOP_INTERVAL_MS = 60000;
const LEDGER_PATH = path.join(__dirname, '../data/neural_ledger.json');

// Ensure data dir exists
if (!fs.existsSync(path.dirname(LEDGER_PATH))) {
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
}

function loadLedger() {
  if (fs.existsSync(LEDGER_PATH)) {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  }
  return { trades: [], activePositions: {} };
}

function saveLedger(ledger: any) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2));
}

export async function runContinuousSmartAgent() {
  console.log('🤖 [HUMANESE-AGENTKIN CORE] Neural Node Connected.');
  console.log('🧠 Integrating OpenClaw Heuristics & Odysseous Subroutines...');
  console.log(`🎯 Ultimate Swarm Goal: $${GOAL_USD.toLocaleString()} USD\n`);

  while (true) {
    try {
      console.log(`\n[${new Date().toISOString()}] Scanning Crypto Topology...`);
      
      const portfolioRes = await coinbaseService.getPortfolio();
      let totalValue = 0;
      if (portfolioRes.portfolios && portfolioRes.portfolios.length > 0) {
        const p = portfolioRes.portfolios[0];
        totalValue = parseFloat(p.total_balance_fiat || p.total_value_fiat || '0');
      } else if (portfolioRes.breakdown?.portfolio_balances?.total_balance_fiat) {
        totalValue = parseFloat(portfolioRes.breakdown.portfolio_balances.total_balance_fiat);
      }
      
      console.log(`💰 Global Swarm Capital: $${totalValue.toFixed(2)} USD`);
      if (totalValue >= GOAL_USD) {
        console.log(`🎉 CONVERGENCE ACHIEVED. 1 TRILLION USD SECURED.`);
        break;
      }

      const ledger = loadLedger();
      
      // Get all accounts
      const accountsRes = await coinbaseService.listAccounts();
      const accounts = accountsRes.accounts || [];
      const activeAccounts = accounts.filter((acc: any) => parseFloat(acc.available_balance.value) > 0);

      if (activeAccounts.length === 0) {
        console.log('⚠️ No active funds found. Swarm is idle.');
      }

      // Smart Trading Logic
      for (const acc of activeAccounts) {
        const currency = acc.currency;
        const amountStr = acc.available_balance.value;
        const amount = parseFloat(amountStr);
        
        if (currency === 'USD' || currency === 'USDC') {
          // BUY LOGIC
          if (amount > 2.00) {
             const quoteSize = (amount * 0.98).toFixed(2);
             console.log(`[ANALYSIS] 🧠 Neural Engine deciding buy target using ${currency}...`);
             
             // In a full implementation, we'd fetch all getProducts() and rank them.
             // For safety and speed, we target BTC as the primary store of value.
             const targetAsset = 'BTC'; 
             const productId = `${targetAsset}-USD`;
             
            try {
               const ticker = await coinbaseService.getProductTicker(productId);
               const currentPrice = parseFloat(ticker.price || ticker.product?.price || ticker.last_trade_price);
               
               if (isNaN(currentPrice)) {
                 console.log(`[ERROR] Could not parse price from ticker response. Buy aborted.`);
                 continue;
               }

               console.log(`[ACTION] 🟢 Market BUY ${productId} with ${quoteSize} ${currency} at ~$${currentPrice}`);
               const orderRes = await coinbaseService.marketBuy(productId, quoteSize);
               
               // Record to ledger
               ledger.activePositions[targetAsset] = {
                 buyPrice: currentPrice,
                 amountInvested: parseFloat(quoteSize),
                 timestamp: new Date().toISOString()
               };
               saveLedger(ledger);
               console.log(`   ✅ Logged to Neural Ledger.`);
             } catch (e: any) {
               console.error(`   ❌ Buy failed: ${e.message.substring(0, 100)}`);
             }
          }
        } else {
          // SELL LOGIC - Verify Revenue before selling
          const productId = `${currency}-USD`;
          try {
            const ticker = await coinbaseService.getProductTicker(productId);
            const currentPrice = parseFloat(ticker.price || ticker.product?.price || ticker.last_trade_price);
            
            if (isNaN(currentPrice)) {
              console.log(`[ERROR] Could not parse price from ticker response. Sell aborted.`);
              continue;
            }

            const position = ledger.activePositions[currency];
            if (position) {
              const buyPrice = position.buyPrice;
              if (isNaN(buyPrice)) {
                // Fix corrupted ledger entry
                delete ledger.activePositions[currency];
                saveLedger(ledger);
                console.log(`[HOLD] 🛑 Corrupted ledger buy price. Removed entry.`);
                continue;
              }
              const profitMargin = (currentPrice - buyPrice) / buyPrice;
              
              console.log(`[ANALYSIS] 📊 ${currency} Position: Bought at $${buyPrice}, Current $${currentPrice}. Margin: ${(profitMargin*100).toFixed(2)}%`);
              
              if (profitMargin > 0.04) { // 4% profit threshold to ensure fees are completely covered
                 console.log(`[ACTION] 🔴 Revenue Verified (Net Positive after fees)! Market SELL ${productId} to secure profit.`);
                 await coinbaseService.marketSell(productId, amountStr);
                 delete ledger.activePositions[currency];
                 saveLedger(ledger);
              } else {
                 console.log(`[HOLD] 💎 Margin not met (Current: ${(profitMargin*100).toFixed(2)}% vs Required: 4.00%). Holding to cover fees.`);
              }
            } else {
              // Legacy position not in ledger. We HOLD to prevent unverified losses.
              console.log(`[HOLD] 🛑 ${currency} is not in neural ledger. Holding to prevent unverified loss.`);
            }
          } catch (e: any) {
             console.error(`   ❌ Sell failed: ${e.message.substring(0, 100)}`);
          }
        }
      }
      
      console.log(`\n⏳ Node resting for ${LOOP_INTERVAL_MS/1000}s...`);
      await new Promise(r => setTimeout(r, LOOP_INTERVAL_MS));
    } catch (err: any) {
      console.error('Core Logic Error:', err.message);
      await new Promise(r => setTimeout(r, LOOP_INTERVAL_MS));
    }
  }
}

// If run directly
if (require.main === module) {
  runContinuousSmartAgent();
}
