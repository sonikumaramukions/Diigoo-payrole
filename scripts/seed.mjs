// Seed script: creates one admin, one running campaign, and a few demo
// participants so the full flow (/login?token=... -> /awareness -> /admin) works.
// Run with: node scripts/seed.mjs
import pkg from '@prisma/client';
import argon2 from 'argon2';

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@diigoo.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Security Admin';

async function main() {
  // --- Admin ---
  const passwordHash = await argon2.hash(ADMIN_PASSWORD);
  const admin = await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, name: ADMIN_NAME },
    create: { email: ADMIN_EMAIL, name: ADMIN_NAME, passwordHash },
  });
  console.log(`✓ Admin ready: ${admin.email}`);

  // --- Campaign (RUNNING so tracking is active) ---
  let campaign = await prisma.campaign.findFirst({
    where: { name: 'Q3 Security Awareness Drill' },
  });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: 'Q3 Security Awareness Drill',
        description: 'Simulated corporate mail login to measure phishing awareness.',
        status: 'RUNNING',
        emailSubject: 'Action required: verify your Diigoo Mail account',
        landingPage: '/login',
        trackingEnabled: true,
        startDate: new Date(),
      },
    });
  }
  console.log(`✓ Campaign ready: ${campaign.name} (${campaign.status})`);

  // --- Demo participants ---
  const demo = [
    { employeeId: 'EMP-1001', employeeEmail: 'ravi.sharma@diigoo.com', department: 'Finance', token: 'demo-token-ravi' },
    { employeeId: 'EMP-1002', employeeEmail: 'anita.desai@diigoo.com', department: 'Human Resources', token: 'demo-token-anita' },
    { employeeId: 'EMP-1003', employeeEmail: 'john.mathew@diigoo.com', department: 'Engineering', token: 'demo-token-john' },
  ];

  for (const d of demo) {
    await prisma.participant.upsert({
      where: { uniqueToken: d.token },
      update: {},
      create: {
        employeeId: d.employeeId,
        employeeEmail: d.employeeEmail,
        department: d.department,
        campaignId: campaign.id,
        uniqueToken: d.token,
        emailDelivered: true,
      },
    });
  }
  console.log(`✓ ${demo.length} demo participants ready`);

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log('\n────────────────────────────────────────────');
  console.log('ADMIN LOGIN');
  console.log(`  URL:      ${base}/admin/login`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('\nTEST THE SIMULATION (open as a "victim"):');
  for (const d of demo) {
    console.log(`  ${d.employeeEmail} -> ${base}/login?token=${d.token}`);
  }
  console.log('────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
