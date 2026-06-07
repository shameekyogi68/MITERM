import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const members = [
    { name: 'Shameek', distance: 252 },
    { name: 'Shreekumar', distance: 250 },
    { name: 'Rahul', distance: 250 },
    { name: 'Sanjay', distance: 244 },
    { name: 'Prashant', distance: 236 },
    { name: 'Sathwik', distance: 114 },
  ];

  for (const m of members) {
    await prisma.member.upsert({
      where: { name: m.name },
      update: { distance: m.distance },
      create: m,
    });
  }

  const settings = [
    { key: 'mileage', value: 16 },
    { key: 'routeDistance', value: 252 },
    { key: 'qrImageUrl', value: '' },
    { key: 'adminSecretUrl', value: 'mite-admin-2026' },
    { key: 'roundingRule', value: 'ADJUST_TO_ADMIN' },
    { key: 'petrolPriceOffset', value: 8.39 },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  const petrolDate = new Date('2026-01-01T00:00:00.000Z');
  await prisma.petrolPrice.upsert({
    where: { date: petrolDate },
    update: {},
    create: { price: 110.23, date: petrolDate, source: 'MANUAL' },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${members.length} members`);
  console.log(`   - ${settings.length} settings`);
  console.log(`   - 1 petrol price record`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
