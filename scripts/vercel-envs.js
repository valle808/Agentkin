const { execSync } = require('child_process');

const envs = {
  COINBASE_API_KEY_NAME: "organizations/e4340569-817c-4b2d-9ba2-d9439408b4f5/apiKeys/38b95b73-cefe-4aad-98e4-d2e15bdeef91",
  COINBASE_PRIVATE_KEY: "-----BEGIN EC PRIVATE KEY-----\\nMHcCAQEEIP+70iUdIv1ELgICKPIQPz9+8g/IlrLP6k+hBvRZaULJoAoGCCqGSM49\\nAwEHoUQDQgAE8HcUL6LylkZTjGFZK5KRv6tIDzHoJ7xyDX2wht/5VhDwRApLZHzp\\nGe2qI9oRCpgIhGgJ5IPRarI+baKoE/Rjxw==\\n-----END EC PRIVATE KEY-----\\n",
  OWNER_XRP_ADDRESS: "rw2ciyaNshpHe7bCHo4bRWq6pqqynnWKQg",
  OWNER_XRP_MEMO: "2932723390",
  OWNER_BTC_ADDRESS: "3CJreF7LD8Heu8zh9MsigedRuNq4y6eujh",
  OWNER_SOL_ADDRESS: "E1pAENVbtiwoktgjvMKhUEhDUGcYCMQ4cCGwDruruzTL",
  OWNER_BNB_ADDRESS: "0xF76581E2Dc7746B92b258098c9F3C90E691B6dc9"
};

for (const [key, value] of Object.entries(envs)) {
  console.log(`Adding ${key}...`);
  try {
    // We replace literal \\n with actual \n for the echo input, or we can just send the string with \\n verbatim.
    // The previous implementation used literal backslash-n, so we'll send it exactly as it is in .env
    execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`✅ ${key} added successfully.`);
  } catch(e) {
    console.error(`❌ Failed to add ${key}`);
    console.error(e.stderr?.toString());
  }
}
