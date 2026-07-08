const { PrismaClient } = require('../app/generated/prisma/client.ts');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const globalSettings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
  const personalized = await prisma.personalizedSettings.findMany();
  console.log('=== GLOBAL SETTINGS ===');
  console.log(globalSettings);
  console.log('=== PERSONALIZED SETTINGS ===');
  console.log(personalized);
}

main().catch(console.error).finally(() => prisma.$disconnect());
