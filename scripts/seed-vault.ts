/**
 * AgentKin Vault Seed Script
 * ----------------------------
 * Reads secrets from .env and stores them encrypted in the database.
 * Run ONCE after initial setup, or anytime you update a secret.
 *
 * Usage:
 *   npx ts-node scripts/seed-vault.ts
 *
 * Prerequisites:
 *   - .env must have VAULT_MASTER_KEY set (64-char hex)
 *   - Database must be running and migrated
 *
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Must load env BEFORE importing vault (vault reads env at import time)
import { vault } from '../src/services/vaultService';

interface SecretEntry {
  key: string;
  envVar: string;
  category: string;
  description: string;
  required: boolean;
}

const SECRETS_TO_SEED: SecretEntry[] = [
  // ─── Coinbase ──────────────────────────────────────────────
  {
    key: 'COINBASE_API_KEY_NAME',
    envVar: 'COINBASE_API_KEY_NAME',
    category: 'COINBASE',
    description: 'Coinbase Advanced Trade API key name (organizations/.../apiKeys/...)',
    required: true,
  },
  {
    key: 'COINBASE_PRIVATE_KEY',
    envVar: 'COINBASE_PRIVATE_KEY',
    category: 'COINBASE',
    description: 'Coinbase EC private key (PEM format, \\n escaped)',
    required: true,
  },

  // ─── Owner Wallets ─────────────────────────────────────────
  {
    key: 'OWNER_XRP_ADDRESS',
    envVar: 'OWNER_XRP_ADDRESS',
    category: 'WALLET',
    description: 'Owner XRP wallet address',
    required: false,
  },
  {
    key: 'OWNER_XRP_MEMO',
    envVar: 'OWNER_XRP_MEMO',
    category: 'WALLET',
    description: 'Owner XRP destination tag / memo',
    required: false,
  },
  {
    key: 'OWNER_BTC_ADDRESS',
    envVar: 'OWNER_BTC_ADDRESS',
    category: 'WALLET',
    description: 'Owner Bitcoin wallet address',
    required: false,
  },
  {
    key: 'OWNER_SOL_ADDRESS',
    envVar: 'OWNER_SOL_ADDRESS',
    category: 'WALLET',
    description: 'Owner Solana wallet address',
    required: false,
  },
  {
    key: 'OWNER_BNB_ADDRESS',
    envVar: 'OWNER_BNB_ADDRESS',
    category: 'WALLET',
    description: 'Owner BNB wallet address',
    required: false,
  },

  // ─── Auth & Security ───────────────────────────────────────
  {
    key: 'JWT_SECRET',
    envVar: 'JWT_SECRET',
    category: 'AUTH',
    description: 'JWT signing secret',
    required: false,
  },
  {
    key: 'SWEEP_PASSWORD_HASH',
    envVar: 'SWEEP_PASSWORD_HASH',
    category: 'AUTH',
    description: 'SHA-256 HMAC hash of the owner sweep password',
    required: true,
  },

  // ─── AI Keys ──────────────────────────────────────────────
  {
    key: 'OPENAI_API_KEY',
    envVar: 'OPENAI_API_KEY',
    category: 'AI',
    description: 'OpenAI API key',
    required: false,
  },
  {
    key: 'GEMINI_API_KEY',
    envVar: 'GEMINI_API_KEY',
    category: 'AI',
    description: 'Google Gemini API key',
    required: false,
  },

  // ─── Stripe ───────────────────────────────────────────────
  {
    key: 'STRIPE_SECRET_KEY',
    envVar: 'STRIPE_SECRET_KEY',
    category: 'PAYMENTS',
    description: 'Stripe secret key',
    required: false,
  },
];

async function seedVault() {
  console.log('\n🏛️  AgentKin Vault Seeder');
  console.log('─'.repeat(50));

  if (!process.env.VAULT_MASTER_KEY) {
    console.error('\n❌ VAULT_MASTER_KEY not set in .env');
    console.log('\nGenerate one with:');
    console.log('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.log('\nThen add to .env:  VAULT_MASTER_KEY=<64-char-hex>\n');
    process.exit(1);
  }

  let seeded = 0;
  let skipped = 0;
  let errors = 0;

  for (const secret of SECRETS_TO_SEED) {
    const value = process.env[secret.envVar];

    if (!value) {
      if (secret.required) {
        console.warn(`⚠️  REQUIRED — ${secret.key} not set in .env — skipping`);
        errors++;
      } else {
        console.log(`⏭️  Optional — ${secret.key} not set — skipping`);
        skipped++;
      }
      continue;
    }

    try {
      await vault.set(secret.key, value, secret.category, secret.description);
      console.log(`✅ Encrypted & stored: ${secret.key} [${secret.category}]`);
      seeded++;
    } catch (err: any) {
      console.error(`❌ Failed to store ${secret.key}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n─'.repeat(50));
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Seeded:  ${seeded}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors:  ${errors}`);

  if (errors === 0) {
    console.log('\n🎉 Vault ready! AgentKin ecosystem can now use vault.get() for all secrets.');
  } else {
    console.log('\n⚠️  Some secrets were not seeded. Fill in the missing values in .env and re-run.');
  }

  // Print vault summary
  console.log('\n🔐 Current vault contents:');
  const listing = await vault.list();
  listing.forEach(s => {
    console.log(`   [${s.category.padEnd(8)}] ${s.key}`);
  });

  console.log('\n');
  process.exit(0);
}

seedVault().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
