import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const TEST_ACCOUNTS = [
  {
    email: 'admin@example.com',
    fullName: 'Administrator',
    password: 'Admin@123',
    role: 'ADMIN',
  },
  {
    email: 'inputter@example.com',
    fullName: 'Inputter User',
    password: 'Pass@123',
    role: 'INPUTTER',
  },
  {
    email: 'inputter_ho@example.com',
    fullName: 'Inputter HO',
    password: 'Pass@123',
    role: 'INPUTTER_HO',
  },
  {
    email: 'approver@example.com',
    fullName: 'Approver / Supervisor',
    password: 'Pass@123',
    role: 'APPROVER',
  },
  {
    email: 'approver_ho@example.com',
    fullName: 'Approver HO',
    password: 'Pass@123',
    role: 'APPROVER_HO',
  },
  {
    email: 'brand@example.com',
    fullName: 'Brand Manager',
    password: 'Pass@123',
    role: 'BRAND',
  },
  {
    email: 'brand_manager@example.com',
    fullName: 'Senior Brand Manager',
    password: 'Pass@123',
    role: 'BRAND_MANAGER',
  },
];
    password: 'Pass@123',
    role: 'OPERATIONS_MANAGER',
  },
];

async function seedTestAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('Starting test account seeding...\n');
    
    // First, ensure roles exist
    const rolesData = [
      { code: 'ADMIN', name: 'Administrator' },
      { code: 'REQUESTER', name: 'Requester' },
      { code: 'CENTRAL_REQUESTER', name: 'Central Requester' },
      { code: 'SUPERVISOR', name: 'Supervisor' },
      { code: 'CENTRAL_SUPERVISOR', name: 'Central Supervisor' },
      { code: 'OPERATIONS_SPECIALIST', name: 'Operations Specialist' },
      { code: 'OPERATIONS_MANAGER', name: 'Operations Manager' },
    ];

    console.log('Ensuring roles exist...');
    for (const roleData of rolesData) {
      await client.query(
        `INSERT INTO roles (code, name) 
         VALUES ($1, $2) 
         ON CONFLICT (code) DO NOTHING`,
        [roleData.code, roleData.name]
      );
    }
    console.log('✓ Roles ensured\n');

    // Create test accounts
    let createdCount = 0;
    let skippedCount = 0;

    for (const account of TEST_ACCOUNTS) {
      const passwordHash = crypto
        .createHash('sha256')
        .update(account.password)
        .digest('hex');

      try {
        const result = await client.query(
          `INSERT INTO users (email, full_name, password_hash, role_id, status)
           SELECT $1, $2, $3, r.id, 'ACTIVE'
           FROM roles r
           WHERE r.code = $4
           ON CONFLICT (lower(email)) DO NOTHING
           RETURNING id, email, full_name`,
          [account.email.toLowerCase(), account.fullName, passwordHash, account.role]
        );

        if (result.rows.length > 0) {
          console.log(`✓ Created: ${account.email} (${account.role})`);
          createdCount++;
        } else {
          console.log(`⊘ Already exists: ${account.email}`);
          skippedCount++;
        }
      } catch (err: any) {
        console.error(`✗ Failed to create ${account.email}: ${err.message}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Skipped (already exist): ${skippedCount}`);
    console.log(`   Total: ${createdCount + skippedCount}\n`);

    // Display all users
    console.log('📋 All users in database:\n');
    const users = await client.query(
      `SELECT u.id, u.email, u.full_name, r.code as role, u.status, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );

    users.rows.forEach((user: any) => {
      console.log(`  • ${user.email.padEnd(35)} | Role: ${user.role.padEnd(20)} | Status: ${user.status}`);
    });

    console.log('\n✨ Seeding completed!\n');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestAccounts().catch((err) => {
  console.error(err);
  process.exit(1);
});
