/**
 * Super Administrator Seeding & Promotion Script
 *
 * Usage:
 *   node scripts/seed-superadmin.js
 *   node scripts/seed-superadmin.js --email super@campus.ng --password "StrongPass123!" --name "Chief Super Admin"
 *
 * Environment variable alternatives:
 *   SUPERADMIN_EMAIL
 *   SUPERADMIN_PASSWORD
 *   SUPERADMIN_NAME
 */

require('dotenv').config();
const { ensureSafeDb } = require('./ensure-safe-db');
ensureSafeDb('scripts/seed-superadmin.js');

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv.length > idx + 1) {
    return process.argv[idx + 1];
  }
  return null;
}

async function seedSuperAdmin() {
  console.log('\n======================================================');
  console.log('       CAMPUS MARKETPLACE - SUPER ADMIN SEEDER        ');
  console.log('======================================================\n');

  const email = (
    getArg('--email') ||
    process.env.SUPERADMIN_EMAIL ||
    'superadmin@campustrade.ng'
  ).toLowerCase().trim();

  let password = getArg('--password') || process.env.SUPERADMIN_PASSWORD;
  const fullName = getArg('--name') || process.env.SUPERADMIN_NAME || 'Platform Super Administrator';

  let generatedPassword = false;
  if (!password) {
    password = 'SuperAdmin!' + crypto.randomBytes(8).toString('hex');
    generatedPassword = true;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findFirst({
    where: { email },
  });

  let superAdminUser;

  if (existing) {
    console.log(`[UPDATE] Found existing user account with email "${email}".`);
    console.log(`Promoting role from "${existing.role}" -> "SUPERADMIN"...`);

    superAdminUser = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'SUPERADMIN',
        fullName: fullName || existing.fullName,
        passwordHash,
        emailVerified: existing.emailVerified || new Date(),
      },
    });

    console.log(`✓ Successfully updated and promoted user to SUPERADMIN.`);
  } else {
    console.log(`[CREATE] Creating new SUPERADMIN user account for "${email}"...`);

    superAdminUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SUPERADMIN',
        fullName,
        phone: '+2348000000001',
        emailVerified: new Date(),
      },
    });

    console.log(`✓ Successfully created new SUPERADMIN account.`);
  }

  console.log('\n---------------- ACCOUNT DETAILS ----------------');
  console.log(`User ID   : ${superAdminUser.id}`);
  console.log(`Full Name : ${superAdminUser.fullName}`);
  console.log(`Email     : ${superAdminUser.email}`);
  console.log(`Role      : ${superAdminUser.role}`);
  console.log(`Password  : ${password}`);
  if (generatedPassword) {
    console.log('NOTE: A secure random password was automatically generated.');
  }
  console.log('--------------------------------------------------\n');

  console.log('================ SECURITY ADVISORY ===============');
  console.log('1. [RECOMMENDED] 2-Factor Authentication (2FA/TOTP):');
  console.log('   Super Administrator privileges allow managing Founding Vendor');
  console.log('   Coupons, altering redemption caps, revoking vendor licenses, and');
  console.log('   overriding platform commissions. Multi-factor authentication is');
  console.log('   strongly advised for production deployment.');
  console.log('2. Keep credentials in a secure secrets manager (e.g. AWS Secrets');
  console.log('   Manager, Doppler, or HashiCorp Vault). Never commit passwords');
  console.log('   or env files to public version control repositories.');
  console.log('==================================================\n');
}

seedSuperAdmin()
  .catch((err) => {
    console.error('Fatal error during superadmin seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
