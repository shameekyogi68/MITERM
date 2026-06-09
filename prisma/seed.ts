import 'dotenv/config';
import { prisma } from '../lib/prisma';

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
    { key: 'qrImageUrl', value: '/qr-code.jpeg' },
    { key: 'adminSecretUrl', value: 'shameekyogi68' },
    { key: 'roundingRule', value: 'ADJUST_TO_ADMIN' },
    { key: 'petrolPrice', value: 110.80 },
    { key: 'upiPhonePe', value: '7338603959@ybl' },
    { key: 'upiGPay', value: 'shameekyogiofficial@oksbi' },
    { key: 'upiPaytm', value: '7338603959@ptyes' },
    { key: 'adminPhone', value: '7338603959' },
    { key: 'payeeName', value: 'SHAMEEK YOGI' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

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
