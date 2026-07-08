import { db } from '../lib/db';

async function main() {
  const modules = await db.pageModule.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  console.log('--- PageModules in DB ---');
  console.log(modules);
}

main().catch(console.error).finally(() => db.$disconnect());
