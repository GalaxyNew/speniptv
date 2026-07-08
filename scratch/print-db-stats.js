const { PrismaClient } = require('../app/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const contents = await prisma.moduleContent.findMany({
    where: { moduleId: 'hero' }
  });
  console.log(contents);
}

main().catch(console.error).finally(() => prisma.$disconnect());
