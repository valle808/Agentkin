import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file in the root
dotenv.config({ path: path.join(__dirname, '../.env') });

import { coinbaseService } from '../src/services/coinbaseService';

const GOAL_USD = 1000000000; // 1 Billion USD
const LOOP_INTERVAL_MS = 60000; // 60 seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runContinuousAgent() {
  console.log('🤖 AgentKin Trading Swarm Initiated in UNSTOPPABLE mode.');
  console.log(`🎯 Target Goal: $${GOAL_USD.toLocaleString()} USD\n`);

  while (true) {
    try {
      console.log(`[${new Date().toISOString()}] Starting new trading cycle...`);
      
      // 1. Check Total Portfolio Value
      const portfolioRes = await coinbaseService.getPortfolio();
      // Usually portfolio breakdown holds total_balance_fiat
      let totalValue = 0;
      if (portfolioRes.portfolios && portfolioRes.portfolios.length > 0) {
        const p = portfolioRes.portfolios[0];
        totalValue = parseFloat(p.total_balance_fiat || p.total_value_fiat || '0');
      } else if (portfolioRes.breakdown?.portfolio_balances?.total_balance_fiat) {
        totalValue = parseFloat(portfolioRes.breakdown.portfolio_balances.total_balance_fiat);
      }
      
      console.log(`💰 Current Portfolio Value: $${totalValue.toFixed(2)} USD`);
      
      if (totalValue >= GOAL_USD) {
        console.log(`\n🎉 MISSION ACCOMPLISHED! The swarm has reached $${GOAL_USD.toLocaleString()} USD!`);
        console.log('Shutting down trading agents.');
        break;
      }
      
      // 2. Fetch Accounts and Execute Trades
      const res = await coinbaseService.listAccounts();
      const accounts = res.accounts || [];
      
      // Filter out accounts with zero available balance
      const activeAccounts = accounts.filter((acc: any) => parseFloat(acc.available_balance.value) > 0);
      
      if (activeAccounts.length === 0) {
        console.log('⚠️ No available funds found to trade. The agents are idle.');
      } else {
        console.log(`Found ${activeAccounts.length} accounts with available funds.`);
        
        // Process each active account
        for (const acc of activeAccounts) {
          const currency = acc.currency;
          const amountStr = acc.available_balance.value;
          const amount = parseFloat(amountStr);
          
          try {
            if (currency === 'USD' || currency === 'USDC') {
              // --- FIAT to CRYPTO (BUY) ---
              if (amount > 1.50) { 
                const quoteSize = (amount * 0.98).toFixed(2); 
                console.log(`[ACTION] 🟢 Attempting Market BUY for BTC-USD with ${quoteSize} ${currency}`);
                const orderRes = await coinbaseService.marketBuy('BTC-USD', quoteSize);
                console.log(`   ✅ BUY Success.`);
              }
            } else {
              // --- CRYPTO to FIAT (SELL) ---
              console.log(`[ACTION] 🔴 Attempting Market SELL for ${currency}-USD using entire balance (${amountStr} ${currency})`);
              const productId = `${currency}-USD`;
              const baseSize = amountStr; 
              
              const orderRes = await coinbaseService.marketSell(productId, baseSize);
              console.log(`   ✅ SELL Success.`);
            }
          } catch (err: any) {
             // Suppress large error stacks for cleaner console output
             console.error(`   ❌ Failed to trade ${currency} (Balance too low or API limit): ${err.message.substring(0, 100)}...`);
          }
        }
      }
      
      console.log(`\n⏳ Swarm resting for ${LOOP_INTERVAL_MS / 1000} seconds before next cycle...`);
      await sleep(LOOP_INTERVAL_MS);
      
    } catch (err: any) {
      console.error('Agent Swarm execution error:', err.message);
      console.log('⏳ Retrying in 60 seconds...');
      await sleep(LOOP_INTERVAL_MS);
    }
  }
}

// Start the continuous agent loop
runContinuousAgent();
