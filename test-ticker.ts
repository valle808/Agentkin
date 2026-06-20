import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });
import { coinbaseService } from './src/services/coinbaseService';

async function test() {
  try {
    const res = await coinbaseService.getBestBidAsk(['BTC-USD']);
    console.log("getBestBidAsk:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
