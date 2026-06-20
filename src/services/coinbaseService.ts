import crypto from 'crypto';
import https from 'https';

/**
 * Coinbase Advanced Trade API Service
 * Uses JWT (ES256) authentication with EC private key.
 *
 * Credentials are loaded exclusively from environment variables.
 * NEVER hardcode keys here — set them in your .env file locally
 * and in Vercel/Railway dashboard for production.
 *
 * Required env vars:
 *   COINBASE_API_KEY_NAME   — e.g. organizations/.../apiKeys/...
 *   COINBASE_PRIVATE_KEY    — EC private key PEM string (with \n as literal \\n in .env)
 *
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

const COINBASE_API_HOST = 'api.coinbase.com';
const COINBASE_API_VERSION = '/api/v3/brokerage';

// ─── Owner Wallet Addresses (your personal payout addresses) ─────────────────
// These are the destination addresses for withdrawals initiated by AgentKin.
export const OWNER_WALLETS = {
  XRP: {
    address: process.env.OWNER_XRP_ADDRESS || '',
    memo: process.env.OWNER_XRP_MEMO || '',
  },
  BTC: {
    address: process.env.OWNER_BTC_ADDRESS || '',
  },
  SOL: {
    address: process.env.OWNER_SOL_ADDRESS || '',
  },
  BNB: {
    address: process.env.OWNER_BNB_ADDRESS || '',
  },
};

// ─── JWT Token Generator ──────────────────────────────────────────────────────

function buildJWT(method: string, path: string): string {
  const keyName = process.env.COINBASE_API_KEY_NAME;
  const privateKeyRaw = process.env.COINBASE_PRIVATE_KEY;

  if (!keyName || !privateKeyRaw) {
    throw new Error(
      'Missing COINBASE_API_KEY_NAME or COINBASE_PRIVATE_KEY env vars. ' +
      'Set them in your .env file — never hardcode keys in source code.'
    );
  }

  // .env stores \n as literal \\n — convert back to real newlines
  const privateKeyPem = privateKeyRaw.replace(/\\n/g, '\n');

  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyName, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: keyName,
    iss: 'coinbase-cloud',
    nbf: now,
    exp: now + 120,
    uri: `${method} ${COINBASE_API_HOST}${path}`,
  })).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign({ key: privateKeyPem, dsaEncoding: 'ieee-p1363' }, 'base64url');

  return `${signingInput}.${signature}`;
}

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

function coinbaseRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: object
): Promise<T> {
  return new Promise((resolve, reject) => {
    const jwt = buildJWT(method, path);
    const bodyStr = body ? JSON.stringify(body) : '';

    const options: https.RequestOptions = {
      hostname: COINBASE_API_HOST,
      path,
      method,
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Coinbase API Error ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed as T);
          }
        } catch {
          reject(new Error(`Failed to parse Coinbase response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const coinbaseService = {

  /** List all portfolios / accounts */
  async listAccounts(): Promise<any> {
    return coinbaseRequest('GET', `${COINBASE_API_VERSION}/accounts`);
  },

  /** Get a single account by UUID */
  async getAccount(accountUuid: string): Promise<any> {
    return coinbaseRequest('GET', `${COINBASE_API_VERSION}/accounts/${accountUuid}`);
  },

  /** Get current portfolio balances */
  async getPortfolio(): Promise<any> {
    return coinbaseRequest('GET', `${COINBASE_API_VERSION}/portfolios`);
  },

  /** Get best bid/ask for a product (e.g. 'BTC-USD') */
  async getBestBidAsk(productIds: string[]): Promise<any> {
    const query = productIds.map((id) => `product_ids=${id}`).join('&');
    return coinbaseRequest('GET', `${COINBASE_API_VERSION}/best_bid_ask?${query}`);
  },

  /** Get all available products / cryptos */
  async getProducts(): Promise<any> {
    return coinbaseRequest('GET', `${COINBASE_API_VERSION}/products`);
  },

  /** Get ticker for a specific product */
  async getProductTicker(productId: string): Promise<any> {
    return coinbaseRequest('GET', `${COINBASE_API_VERSION}/products/${productId}`);
  },

  /** Get historical OHLCV candles */
  async getHistoricalCandles(productId: string, start: string, end: string, granularity: string): Promise<any> {
    return coinbaseRequest('GET', `${COINBASE_API_VERSION}/products/${productId}/candles?start=${start}&end=${end}&granularity=${granularity}`);
  },

  /** Place a market buy order */
  async marketBuy(productId: string, quoteSize: string): Promise<any> {
    return coinbaseRequest('POST', `${COINBASE_API_VERSION}/orders`, {
      client_order_id: crypto.randomUUID(),
      product_id: productId,
      side: 'BUY',
      order_configuration: {
        market_market_ioc: { quote_size: quoteSize },
      },
    });
  },

  /** Place a market sell order */
  async marketSell(productId: string, baseSize: string): Promise<any> {
    return coinbaseRequest('POST', `${COINBASE_API_VERSION}/orders`, {
      client_order_id: crypto.randomUUID(),
      product_id: productId,
      side: 'SELL',
      order_configuration: {
        market_market_ioc: { base_size: baseSize },
      },
    });
  },

  /** List open orders */
  async listOrders(productId?: string): Promise<any> {
    const query = productId ? `?product_id=${productId}&order_status=OPEN` : '?order_status=OPEN';
    return coinbaseRequest('GET', `${COINBASE_API_VERSION}/orders/historical/batch${query}`);
  },

  /** Cancel an order by ID */
  async cancelOrder(orderId: string): Promise<any> {
    return coinbaseRequest('POST', `${COINBASE_API_VERSION}/orders/batch_cancel`, {
      order_ids: [orderId],
    });
  },

  /**
   * Initiate a crypto withdrawal to one of the owner wallet addresses.
   * Requires the Coinbase account UUID for the currency.
   *
   * NOTE: Withdrawals require explicit user action — this does NOT
   * automatically drain funds. It initiates a single withdrawal request.
   */
  async withdrawToOwnerWallet(
    coinbaseAccountId: string,
    currency: 'XRP' | 'BTC' | 'SOL' | 'BNB',
    amount: string
  ): Promise<any> {
    const wallet = OWNER_WALLETS[currency];
    if (!wallet.address) {
      throw new Error(`Owner wallet address for ${currency} is not configured. Set OWNER_${currency}_ADDRESS in .env`);
    }

    const body: any = {
      account_id: coinbaseAccountId,
      amount,
      currency,
      crypto_address: wallet.address,
    };

    // XRP requires a destination tag / memo
    if (currency === 'XRP' && OWNER_WALLETS.XRP.memo) {
      body.destination_tag = OWNER_WALLETS.XRP.memo;
    }

    // Note: This endpoint is on the legacy v2 Coinbase API (withdrawals)
    // Advanced Trade API does not yet expose a direct withdrawal endpoint.
    // Use Coinbase Prime or the v2 sends endpoint for actual withdrawals.
    return coinbaseRequest('POST', `/v2/accounts/${coinbaseAccountId}/transactions`, {
      type: 'send',
      to: wallet.address,
      amount,
      currency,
      ...(currency === 'XRP' && OWNER_WALLETS.XRP.memo ? { destination_tag: OWNER_WALLETS.XRP.memo } : {}),
    });
  },
};
