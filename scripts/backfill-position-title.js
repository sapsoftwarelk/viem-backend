const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Backfilling role.position_title from role.name where empty...');
  const roles = await prisma.role.findMany();
  for (const r of roles) {
    if (!r.position_title || r.position_title === '') {
      const newTitle = r.name || `role-${r.id}`;
      console.log(`Updating role ${r.id}: setting position_title='${newTitle}'`);
      await prisma.role.update({ where: { id: r.id }, data: { position_title: newTitle } });
    }
  }
  console.log('Done backfilling.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
