/**
 * AgentKin Vault Seed Script (JavaScript version)
 * Run: node scripts/seed-vault.js
 * Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ALGORITHM = 'aes-256-gcm';

function getMasterKey() {
    const key = process.env.VAULT_MASTER_KEY;
    if (!key || key.length !== 64) {
        throw new Error('VAULT_MASTER_KEY must be a 64-char hex string in .env');
    }
    return Buffer.from(key, 'hex');
}

function encrypt(plaintext) {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        ciphertext: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
    };
}

const SECRETS = [
    { key: 'COINBASE_API_KEY_NAME',  envVar: 'COINBASE_API_KEY_NAME',  category: 'COINBASE',  desc: 'Coinbase API key name',           required: true },
    { key: 'COINBASE_PRIVATE_KEY',   envVar: 'COINBASE_PRIVATE_KEY',   category: 'COINBASE',  desc: 'Coinbase EC private key (PEM)',   required: true },
    { key: 'OWNER_XRP_ADDRESS',      envVar: 'OWNER_XRP_ADDRESS',      category: 'WALLET',    desc: 'Owner XRP address',              required: false },
    { key: 'OWNER_XRP_MEMO',         envVar: 'OWNER_XRP_MEMO',         category: 'WALLET',    desc: 'Owner XRP memo/tag',             required: false },
    { key: 'OWNER_BTC_ADDRESS',      envVar: 'OWNER_BTC_ADDRESS',      category: 'WALLET',    desc: 'Owner BTC address',              required: false },
    { key: 'OWNER_SOL_ADDRESS',      envVar: 'OWNER_SOL_ADDRESS',      category: 'WALLET',    desc: 'Owner SOL address',              required: false },
    { key: 'OWNER_BNB_ADDRESS',      envVar: 'OWNER_BNB_ADDRESS',      category: 'WALLET',    desc: 'Owner BNB address',              required: false },
    { key: 'JWT_SECRET',             envVar: 'JWT_SECRET',             category: 'AUTH',      desc: 'JWT signing secret',             required: false },
    { key: 'SWEEP_PASSWORD_HASH',    envVar: 'SWEEP_PASSWORD_HASH',    category: 'AUTH',      desc: 'Owner sweep password hash',      required: true },
    { key: 'SWEEP_PASSWORD_SALT',    envVar: 'SWEEP_PASSWORD_SALT',    category: 'AUTH',      desc: 'Owner sweep password salt',      required: false },
    { key: 'OPENAI_API_KEY',         envVar: 'OPENAI_API_KEY',         category: 'AI',        desc: 'OpenAI API key',                 required: false },
    { key: 'GEMINI_API_KEY',         envVar: 'GEMINI_API_KEY',         category: 'AI',        desc: 'Google Gemini API key',          required: false },
    { key: 'STRIPE_SECRET_KEY',      envVar: 'STRIPE_SECRET_KEY',      category: 'PAYMENTS',  desc: 'Stripe secret key',              required: false },
];

async function seedVault() {
    console.log('\n🏛️  AgentKin Vault Seeder');
    console.log('─'.repeat(50));

    if (!process.env.VAULT_MASTER_KEY) {
        console.error('\n❌ VAULT_MASTER_KEY not set in .env — aborting');
        process.exit(1);
    }

    let seeded = 0, skipped = 0, errors = 0;

    for (const s of SECRETS) {
        const value = process.env[s.envVar];
        if (!value) {
            const tag = s.required ? '⚠️  REQUIRED' : '⏭️  Optional';
            console.log(`${tag} — ${s.key} not set — skipping`);
            s.required ? errors++ : skipped++;
            continue;
        }
        try {
            const { ciphertext, iv, authTag } = encrypt(value);
            await prisma.encryptedSecret.upsert({
                where:  { key: s.key },
                create: { key: s.key, ciphertext, iv, authTag, category: s.category, description: s.desc },
                update: { ciphertext, iv, authTag, category: s.category, description: s.desc },
            });
            console.log(`✅ Encrypted & stored: ${s.key} [${s.category}]`);
            seeded++;
        } catch (err) {
            console.error(`❌ Failed: ${s.key} — ${err.message}`);
            errors++;
        }
    }

    console.log('\n─'.repeat(50));
    console.log(`\n📊 Results: ✅ ${seeded} seeded  ⏭️  ${skipped} skipped  ❌ ${errors} errors`);

    // Print vault summary
    const listing = await prisma.encryptedSecret.findMany({
        select: { key: true, category: true, updatedAt: true },
        orderBy: { category: 'asc' },
    });

    console.log(`\n🔐 Vault contents (${listing.length} secrets):`);
    listing.forEach(s => console.log(`   [${s.category.padEnd(8)}] ${s.key}`));
    console.log('\n🎉 Vault ready! AgentKin ecosystem uses vault.get() for all secrets.\n');

    await prisma.$disconnect();
    process.exit(errors > 0 ? 1 : 0);
}

seedVault().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
