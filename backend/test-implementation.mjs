import { Pool } from 'pg';
import fs from 'fs';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cms_physical_ads',
  user: 'postgres',
  password: 'postgres'
});

async function runTests() {
  let passed = 0, failed = 0;
  
  console.log('🧪 PHASE 1 & 2 TEST SUITE\n');
  
  try {
    // TEST 1: Check new columns in ad_registrations
    console.log('TEST 1: Verify new columns in ad_registrations table');
    const newCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'ad_registrations'
      AND column_name IN ('assigned_to_brand_user_id', 'procurement_category_proposal', 'other_category_proposal', 'other_proposal', 'prices_locked', 'prices_locked_at')
      ORDER BY column_name;
    `);
    
    if (newCols.rows.length === 6) {
      console.log('✅ PASS: All 6 new columns exist\n');
      passed++;
    } else {
      console.log(`❌ FAIL: Expected 6 columns, found ${newCols.rows.length}\n`);
      failed++;
    }
    
    // TEST 2: Check manager_id in users table
    console.log('TEST 2: Verify manager_id in users table');
    const managerCol = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'manager_id';
    `);
    
    if (managerCol.rows.length === 1) {
      console.log('✅ PASS: manager_id column exists\n');
      passed++;
    } else {
      console.log('❌ FAIL: manager_id column not found\n');
      failed++;
    }
    
    // TEST 3: Check indexes
    console.log('TEST 3: Verify indexes created');
    const indexes = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('ad_registrations', 'users')
      AND indexname LIKE '%idx_%';
    `);
    
    if (indexes.rows.length >= 4) {
      console.log(`✅ PASS: ${indexes.rows.length} indexes found\n`);
      passed++;
    } else {
      console.log(`❌ FAIL: Expected 4+ indexes, found ${indexes.rows.length}\n`);
      failed++;
    }
    
    // TEST 4: Check workflow types file
    console.log('TEST 4: Verify workflow types updated');
    const typesContent = fs.readFileSync('./src/workflow/types.ts', 'utf8');
    const hasNewStates = typesContent.includes('BRAND_INTAKE') && 
                         typesContent.includes('ACCEPTANCE_REVIEW') &&
                         typesContent.includes('BRAND_MANAGER_APPROVAL');
    const hasNewRoles = typesContent.includes("'BRAND'") && 
                        typesContent.includes("'BRAND_MANAGER'") &&
                        typesContent.includes("'INPUTTER'");
    
    if (hasNewStates && hasNewRoles) {
      console.log('✅ PASS: Workflow types updated correctly\n');
      passed++;
    } else {
      console.log('❌ FAIL: Workflow types not properly updated\n');
      failed++;
    }
    
    // TEST 5: Check workflow machine
    console.log('TEST 5: Verify workflow machine transitions');
    const machineContent = fs.readFileSync('./src/workflow/machine.ts', 'utf8');
    const hasTransitions = machineContent.includes('BRAND_INTAKE') &&
                          machineContent.includes('BRAND_MANAGER_APPROVAL') &&
                          machineContent.includes('ACCEPTANCE_REVIEW') &&
                          machineContent.includes('BEGIN_ACCEPTANCE') &&
                          machineContent.includes('SUBMIT_ACCEPTANCE');
    const hasBrandSkip = machineContent.includes("rolesAllowed: ['BRAND']") &&
                         machineContent.includes('BRAND_MANAGER_APPROVAL');
    
    if (hasTransitions && hasBrandSkip) {
      console.log('✅ PASS: Workflow machine transitions correct\n');
      passed++;
    } else {
      console.log('❌ FAIL: Workflow machine not properly updated\n');
      failed++;
    }
    
    // TEST 6: Check test accounts
    console.log('TEST 6: Verify test accounts updated');
    const accountsContent = fs.readFileSync('./seed-test-accounts.ts', 'utf8');
    const hasNewRoles2 = accountsContent.includes("'INPUTTER'") &&
                         accountsContent.includes("'APPROVER'") &&
                         accountsContent.includes("'BRAND'") &&
                         accountsContent.includes("'BRAND_MANAGER'");
    
    if (hasNewRoles2) {
      console.log('✅ PASS: Test accounts updated correctly\n');
      passed++;
    } else {
      console.log('❌ FAIL: Test accounts not updated\n');
      failed++;
    }
    
    // SUMMARY
    console.log('\n' + '='.repeat(50));
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));
    
    if (failed === 0) {
      console.log('\n✅ ALL TESTS PASSED! Ready for Phase 3.');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED. Review above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
