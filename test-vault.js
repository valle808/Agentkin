const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const secrets = await prisma.encryptedSecret.findMany();
  console.log("Vault keys:", secrets.map(s => s.key));
}
main().catch(console.error).finally(() => prisma.$disconnect());
