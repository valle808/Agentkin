import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { RSI } from 'technicalindicators';

// Load environment variables from the .env file in the root
dotenv.config({ path: path.join(__dirname, '../.env') });

import { coinbaseService } from '../src/services/coinbaseService';

const GOAL_USD = 1000000000000; // 1 Trillion USD
const LOOP_INTERVAL_MS = 60000;
const LEDGER_PATH = path.join(__dirname, '../data/neural_ledger.json');

let dynamicMarginThreshold = 0.10; // Default 10%

// Ensure data dir exists
if (!fs.existsSync(path.dirname(LEDGER_PATH))) {
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
}

function loadLedger() {
  if (fs.existsSync(LEDGER_PATH)) {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  }
  return { trades: [], activePositions: {}, scrapedProfits: 0 };
}

function saveLedger(ledger: any) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2));
}

// Simulated LLM Judge to adjust margins
function runLLMJudge(ledger: any) {
  console.log(`\n[JUDGE AGENT] Analyzing trading performance...`);
  // If we have scraped profits, we can afford to be more aggressive or lower margin to secure faster wins
  if (ledger.scrapedProfits > 0) {
    dynamicMarginThreshold = 0.05; // Drop to 5% if we already have a safety net
    console.log(`[JUDGE AGENT] Performance is solid. Lowering margin threshold to 5.00% to accelerate trade velocity.`);
  } else {
    dynamicMarginThreshold = 0.10;
    console.log(`[JUDGE AGENT] Building initial capital. Maintaining strict 10.00% margin threshold.`);
  }
}

export async function runContinuousSmartAgent() {
  console.log('🤖 [HUMANESE-AGENTKIN CORE] Neural Node Connected.');
  console.log('🧠 Integrating Freqtrade Feature Engineering & LLM Judge...');
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
      
      const ledger = loadLedger();
      runLLMJudge(ledger);

      console.log(`💰 Global Swarm Capital: $${totalValue.toFixed(2)} USD | Secured Profits: $${(ledger.scrapedProfits || 0).toFixed(2)}`);
      if (totalValue >= GOAL_USD) {
        console.log(`🎉 CONVERGENCE ACHIEVED. 1 TRILLION USD SECURED.`);
        break;
      }
      
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
             
             const targetAsset = 'BTC'; 
             const productId = `${targetAsset}-USD`;
             
             try {
               // FEATURE ENGINEERING: FETCH OHLCV AND CALCULATE RSI
               const now = new Date();
               const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
               const startStr = Math.floor(yesterday.getTime() / 1000).toString();
               const endStr = Math.floor(now.getTime() / 1000).toString();
               const granularity = '3600'; // 1 hour candles
               
               const candles = await coinbaseService.getHistoricalCandles(productId, startStr, endStr, granularity);
               if (candles && candles.candles) {
                 const closePrices = candles.candles.map((c: any) => parseFloat(c.close)).reverse();
                 const rsiInput = { values: closePrices, period: 14 };
                 const rsiResult = RSI.calculate(rsiInput);
                 const currentRsi = rsiResult[rsiResult.length - 1];

                 console.log(`[FEATURE] ${productId} 14-period RSI: ${currentRsi?.toFixed(2) || 'N/A'}`);

                 // Wait for RSI < 30 (Oversold) to buy
                 if (currentRsi && currentRsi > 30) {
                   console.log(`[HOLD] RSI is ${currentRsi.toFixed(2)} (> 30). Asset is not oversold. Holding ${currency} for better entry.`);
                   continue;
                 }
               } else {
                 console.log(`[WARNING] Could not fetch candles for RSI calculation. Reverting to standard logic.`);
               }

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
          // SELL LOGIC
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
                delete ledger.activePositions[currency];
                saveLedger(ledger);
                console.log(`[HOLD] 🛑 Corrupted ledger buy price. Removed entry.`);
                continue;
              }
              const profitMargin = (currentPrice - buyPrice) / buyPrice;
              
              console.log(`[ANALYSIS] 📊 ${currency} Position: Bought at $${buyPrice}, Current $${currentPrice}. Margin: ${(profitMargin*100).toFixed(2)}%`);
              
              if (profitMargin > dynamicMarginThreshold) { 
                 console.log(`[ACTION] 🔴 Revenue Verified! Market SELL ${productId} to secure profit.`);
                 await coinbaseService.marketSell(productId, amountStr);
                 
                 // PROFIT SCRAPING
                 const profitRaw = (currentPrice - buyPrice) * (position.amountInvested / buyPrice);
                 const scraped = profitRaw * 0.20; // Scrape 20%
                 ledger.scrapedProfits = (ledger.scrapedProfits || 0) + scraped;
                 console.log(`[PROFIT SCRAPER] Securing 20% of profit ($${scraped.toFixed(2)}) into vault.`);

                 delete ledger.activePositions[currency];
                 saveLedger(ledger);
              } else {
                 console.log(`[HOLD] 💎 Margin not met (Current: ${(profitMargin*100).toFixed(2)}% vs Required: ${(dynamicMarginThreshold*100).toFixed(2)}%). Holding.`);
              }
            } else {
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
