import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { URL } from 'node:url';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // Clear existing data in proper order (respecting foreign key constraints)
  await prisma.goodsIssueNoteItem.deleteMany();
  await prisma.goodsReceivedNote.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.consumableBatch.deleteMany();
  await prisma.reusableItem.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();

  // ============================================
  // TOOLS CATEGORY
  // ============================================
  const toolsCategory = await prisma.category.create({
    data: {
      name: 'Tools',
      slug: 'tools',
      subCategories: {
        create: [
          { name: 'Drilling Machines', slug: 'drilling-machines', code: 'DRL' },
          { name: 'Concrete Mixers', slug: 'concrete-mixers', code: 'MIX' },
          { name: 'Generators', slug: 'generators', code: 'GEN' },
          { name: 'Pumps', slug: 'pumps', code: 'PMP' },
          { name: 'Welding Machines', slug: 'welding-machines', code: 'WLD' },
          { name: 'Laser Levels / Surveying', slug: 'laser-levels-surveying', code: 'LEV' },
          { name: 'Excavators', slug: 'excavators', code: 'EXC' },
          { name: 'Cranes', slug: 'cranes', code: 'CRN' },
          { name: 'Scaffolding Systems', slug: 'scaffolding-systems', code: 'SCF' },
          { name: 'Cutting Machines', slug: 'cutting-machines', code: 'CUT' },
        ],
      },
    },
  });

  console.log('✓ Created Tools category with 10 subcategories');

  // ============================================
  // REUSABLE CATEGORY
  // ============================================
  const reusableCategory = await prisma.category.create({
    data: {
      name: 'Reusable',
      slug: 'reusable',
      subCategories: {
        create: [
          { name: 'Scaffolding Frames', slug: 'scaffolding-frames', code: 'SCFF' },
          { name: 'Acrow Props / Steel Props', slug: 'acrow-props', code: 'PROP' },
          { name: 'Formwork / Shuttering Panels', slug: 'formwork-panels', code: 'FWK' },
          { name: 'Scaffold Planks / Boards', slug: 'scaffold-planks', code: 'PLK' },
          { name: 'Column Plates', slug: 'column-plates', code: 'CPLA' },
          { name: 'Safety Netting', slug: 'safety-netting', code: 'SAFE' },
        ],
      },
    },
  });

  console.log('✓ Created Reusable category with 6 subcategories');

  // ============================================
  // CONSUMABLE CATEGORY
  // ============================================
  const consumableCategory = await prisma.category.create({
    data: {
      name: 'Consumable',
      slug: 'consumable',
      subCategories: {
        create: [
          { name: 'Cement (bagged)', slug: 'cement-bagged', code: 'CEM' },
          { name: 'Sand (bulk)', slug: 'sand-bulk', code: 'SND' },
          { name: 'Crushed Stone / Aggregate', slug: 'crushed-stone', code: 'STN' },
          { name: 'Sandbags', slug: 'sandbags', code: 'SBK' },
          { name: 'Rebar / Steel Reinforcement', slug: 'rebar-steel', code: 'RBR' },
          { name: 'Paint', slug: 'paint', code: 'PNT' },
          { name: 'PVC / Plumbing Materials', slug: 'pvc-plumbing', code: 'PVC' },
          { name: 'Ready-mix Concrete', slug: 'ready-mix-concrete', code: 'CONC' },
        ],
      },
    },
  });

  console.log('✓ Created Consumable category with 8 subcategories');

  console.log('✓ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
