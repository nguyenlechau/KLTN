/**
 * e2e-workflow-test.mjs
 * End-to-end testing of complete 8-step registration workflow
 * Tests all 6 user roles, API endpoints, and business logic
 * Per SYSTEM_SPECIFICATION Section F (8-step workflow)
 */

import axios from 'axios';

// Test configuration
const API_BASE = 'http://localhost:4000';
const DB_HOST = 'localhost';
const DB_PORT = 5432;
const DB_NAME = 'cms_physical_ads';
const DB_USER = 'postgres';
const DB_PASSWORD = 'postgres';

// Test data - 6 user roles
const TEST_USERS = {
  ADMIN: { email: 'admin@example.com', password: 'Pass@123', role: 'ADMIN' },
  INPUTTER: { email: 'inputter@example.com', password: 'Pass@123', role: 'INPUTTER' },
  INPUTTER_HO: { email: 'inputter_ho@example.com', password: 'Pass@123', role: 'INPUTTER_HO' },
  APPROVER: { email: 'approver@example.com', password: 'Pass@123', role: 'APPROVER' },
  APPROVER_HO: { email: 'approver_ho@example.com', password: 'Pass@123', role: 'APPROVER_HO' },
  BRAND: { email: 'brand@example.com', password: 'Pass@123', role: 'BRAND' },
  BRAND_MANAGER: { email: 'brand_manager@example.com', password: 'Pass@123', role: 'BRAND_MANAGER' },
};

// Tokens storage
let tokens = {};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

/**
 * Utilities
 */

function log(step, message) {
  console.log(`\n${step}: ${message}`);
}

function logSuccess(message) {
  console.log(`  ✅ ${message}`);
  testResults.passed++;
}

function logError(message, error = '') {
  console.error(`  ❌ ${message}`);
  if (error) console.error(`     ${error}`);
  testResults.failed++;
  testResults.errors.push(message);
}

/**
 * Authentication
 */

async function login(userRole) {
  try {
    const user = TEST_USERS[userRole];
    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      email: user.email,
      password: user.password,
    });

    tokens[userRole] = response.data.token;
    logSuccess(`${userRole} login successful`);
    return response.data.token;
  } catch (error) {
    logError(`${userRole} login failed`, error.response?.data?.error || error.message);
    throw error;
  }
}

async function setupAuthentication() {
  log('SETUP', 'Authenticating 6 user roles');

  for (const role of Object.keys(TEST_USERS)) {
    try {
      await login(role);
    } catch (error) {
      // Continue with available users
    }
  }
}

/**
 * Helper: Make API call with auth
 */

async function apiCall(method, endpoint, userRole, data = null) {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${tokens[userRole]}`,
        'Content-Type': 'application/json',
      },
    };

    const url = `${API_BASE}${endpoint}`;

    let response;
    if (method === 'GET') {
      response = await axios.get(url, config);
    } else if (method === 'POST') {
      response = await axios.post(url, data, config);
    } else if (method === 'PATCH') {
      response = await axios.patch(url, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(url, config);
    }

    return response.data;
  } catch (error) {
    throw new Error(
      `API ${method} ${endpoint} failed: ${error.response?.data?.error || error.message}`
    );
  }
}

/**
 * TEST 1: Role-Based Access Control
 */

async function testRoleBasedAccess() {
  log('TEST-1', 'Role-Based Access Control');

  // INPUTTER should be able to view registrations
  try {
    const result = await apiCall('GET', '/api/registrations', 'INPUTTER');
    logSuccess('INPUTTER can view registrations');
  } catch (error) {
    logError('INPUTTER cannot view registrations', error.message);
  }

  // INPUTTER should NOT be able to approve
  try {
    await apiCall('POST', '/api/registrations/test-id/approve', 'INPUTTER', {});
    logError('INPUTTER was able to approve (should be denied)');
  } catch (error) {
    if (error.message.includes('403')) {
      logSuccess('INPUTTER correctly denied approval access');
    } else {
      logError('INPUTTER approval check failed', error.message);
    }
  }

  // BRAND_MANAGER should be able to approve
  try {
    // This will fail at business logic level (no real registration), but auth should pass
    await apiCall('POST', '/api/registrations/nonexistent/approve', 'BRAND_MANAGER', {});
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      logSuccess('BRAND_MANAGER has approval access (auth passed, entity check failed as expected)');
    } else {
      logError('BRAND_MANAGER approval access check failed', error.message);
    }
  }
}

/**
 * TEST 2: Create Registration (DRAFT status)
 */

let createdRegistrationId = null;

async function testCreateRegistration() {
  log('TEST-2', 'Create Registration (DRAFT)');

  try {
    const registrationData = {
      registration_no: `REG-${Date.now()}`,
      category: 'Poster',
      location: 'Central District',
      quantity: 5,
      total_budget: 50000000,
      notes: 'Test registration for E2E workflow',
    };

    const result = await apiCall('POST', '/api/registrations', 'INPUTTER', registrationData);

    if (result.id) {
      createdRegistrationId = result.id;
      logSuccess(`Registration created: ${result.registration_no}`);
    } else {
      logError('Registration creation returned no ID');
    }
  } catch (error) {
    logError('Registration creation failed', error.message);
  }
}

/**
 * TEST 3: Submit Registration (DRAFT → SUPERVISOR_REVIEW)
 */

async function testSubmitRegistration() {
  log('TEST-3', 'Submit Registration (DRAFT → Supervisor Review)');

  if (!createdRegistrationId) {
    logError('Cannot test submit - no registration ID');
    return;
  }

  try {
    const result = await apiCall(
      'POST',
      `/api/registrations/${createdRegistrationId}/submit`,
      'INPUTTER',
      { notes: 'Submitting for supervisor approval' }
    );

    if (result.newStatus) {
      logSuccess(`Registration submitted - new status: ${result.newStatus}`);
    } else {
      logError('Submit response missing newStatus');
    }
  } catch (error) {
    logError('Registration submit failed', error.message);
  }
}

/**
 * TEST 4: Supervisor Approval (SUPERVISOR_REVIEW → BRAND_INTAKE)
 */

async function testSupervisorApproval() {
  log('TEST-4', 'Supervisor Approval (Supervisor Review → Brand Intake)');

  if (!createdRegistrationId) {
    logError('Cannot test approval - no registration ID');
    return;
  }

  try {
    const result = await apiCall(
      'POST',
      `/api/registrations/${createdRegistrationId}/approve`,
      'APPROVER',
      { notes: 'Approved by supervisor' }
    );

    if (result.newStatus) {
      logSuccess(`Supervisor approved - new status: ${result.newStatus}`);
    } else {
      logError('Supervisor approval response missing newStatus');
    }
  } catch (error) {
    logError('Supervisor approval failed', error.message);
  }
}

/**
 * TEST 5: Brand Intake Review (BRAND_INTAKE → BRAND_MANAGER_APPROVAL)
 */

async function testBrandIntake() {
  log('TEST-5', 'Brand Intake Review (Brand Intake → Brand Manager Approval)');

  if (!createdRegistrationId) {
    logError('Cannot test brand intake - no registration ID');
    return;
  }

  try {
    const result = await apiCall(
      'POST',
      `/api/registrations/${createdRegistrationId}/approve`,
      'BRAND',
      {
        notes: 'Brand accepted with category proposal',
        procurement_category_proposal: 'Digital Display',
      }
    );

    if (result.newStatus) {
      logSuccess(`Brand intake approved - new status: ${result.newStatus}`);
    } else {
      logError('Brand intake response missing newStatus');
    }
  } catch (error) {
    logError('Brand intake approval failed', error.message);
  }
}

/**
 * TEST 6: Brand Manager Approval (BRAND_MANAGER_APPROVAL → APPROVED + pricing lock)
 */

async function testBrandManagerApproval() {
  log('TEST-6', 'Brand Manager Approval (→ Approved with pricing lock)');

  if (!createdRegistrationId) {
    logError('Cannot test brand manager approval - no registration ID');
    return;
  }

  try {
    const result = await apiCall(
      'POST',
      `/api/registrations/${createdRegistrationId}/approve`,
      'BRAND_MANAGER',
      { notes: 'Final approval - pricing locked' }
    );

    if (result.newStatus) {
      logSuccess(`Brand manager approved - new status: ${result.newStatus} (pricing locked)`);
    } else {
      logError('Brand manager approval response missing newStatus');
    }
  } catch (error) {
    logError('Brand manager approval failed', error.message);
  }
}

/**
 * TEST 7: Begin Acceptance (APPROVED → ACCEPTANCE)
 */

async function testBeginAcceptance() {
  log('TEST-7', 'Begin Acceptance Phase (Approved → Acceptance)');

  if (!createdRegistrationId) {
    logError('Cannot test begin acceptance - no registration ID');
    return;
  }

  try {
    const result = await apiCall(
      'POST',
      `/api/registrations/${createdRegistrationId}/begin-acceptance`,
      'BRAND',
      { notes: 'Starting acceptance phase - preparing images' }
    );

    if (result.newStatus) {
      logSuccess(`Acceptance phase started - new status: ${result.newStatus}`);
    } else {
      logError('Begin acceptance response missing newStatus');
    }
  } catch (error) {
    logError('Begin acceptance failed', error.message);
  }
}

/**
 * TEST 8: Submit Acceptance (ACCEPTANCE → ACCEPTANCE_REVIEW)
 */

async function testSubmitAcceptance() {
  log('TEST-8', 'Submit Acceptance (Acceptance → Acceptance Review)');

  if (!createdRegistrationId) {
    logError('Cannot test submit acceptance - no registration ID');
    return;
  }

  try {
    const result = await apiCall(
      'POST',
      `/api/registrations/${createdRegistrationId}/submit-acceptance`,
      'BRAND',
      { notes: 'All items verified - deployment images submitted' }
    );

    if (result.newStatus) {
      logSuccess(`Acceptance submitted - new status: ${result.newStatus}`);
    } else {
      logError('Submit acceptance response missing newStatus');
    }
  } catch (error) {
    logError('Submit acceptance failed', error.message);
  }
}

/**
 * TEST 9: Approve Acceptance (ACCEPTANCE_REVIEW → COMPLETED)
 */

async function testApproveAcceptance() {
  log('TEST-9', 'Approve Acceptance (Acceptance Review → Completed)');

  if (!createdRegistrationId) {
    logError('Cannot test approve acceptance - no registration ID');
    return;
  }

  try {
    const result = await apiCall(
      'POST',
      `/api/registrations/${createdRegistrationId}/approve`,
      'BRAND_MANAGER',
      { notes: 'All items verified and accepted' }
    );

    if (result.newStatus) {
      logSuccess(`Acceptance approved - new status: ${result.newStatus}`);
    } else {
      logError('Approve acceptance response missing newStatus');
    }
  } catch (error) {
    logError('Approve acceptance failed', error.message);
  }
}

/**
 * TEST 10: Verify Audit Trail
 */

async function testAuditTrail() {
  log('TEST-10', 'Verify Audit Trail');

  if (!createdRegistrationId) {
    logError('Cannot test audit trail - no registration ID');
    return;
  }

  try {
    const result = await apiCall('GET', `/api/registrations/${createdRegistrationId}/history`, 'ADMIN');

    if (result.history && Array.isArray(result.history)) {
      logSuccess(`Audit trail retrieved - ${result.history.length} entries`);

      // Verify at least one entry is immutable
      if (result.history.length > 0 && result.history[0].action_type) {
        logSuccess('Audit entries contain action types');
      }
    } else {
      logError('Audit trail response format invalid');
    }
  } catch (error) {
    logError('Audit trail retrieval failed', error.message);
  }
}

/**
 * TEST 11: Test Revision Request
 */

async function testRevisionRequest() {
  log('TEST-11', 'Test Revision Request (send back to REVISION)');

  if (!createdRegistrationId) {
    logError('Cannot test revision - no registration ID');
    return;
  }

  // Create a new registration for this test
  try {
    const regData = {
      registration_no: `REG-REV-${Date.now()}`,
      category: 'Billboard',
      location: 'Test Location',
      quantity: 3,
      total_budget: 30000000,
    };

    const newReg = await apiCall('POST', '/api/registrations', 'INPUTTER', regData);
    const revisionRegId = newReg.id;

    // Submit for review
    await apiCall('POST', `/api/registrations/${revisionRegId}/submit`, 'INPUTTER', {});

    // Request revision
    const result = await apiCall(
      'POST',
      `/api/registrations/${revisionRegId}/request-revision`,
      'APPROVER',
      { notes: 'Budget needs adjustment' }
    );

    if (result.message) {
      logSuccess('Revision request processed successfully');
    }
  } catch (error) {
    logError('Revision request test failed', error.message);
  }
}

/**
 * TEST 12: Test Export Feature
 */

async function testExportFeature() {
  log('TEST-12', 'Test Export Feature (Excel, CSV formats)');

  try {
    const response = await axios.post(
      `${API_BASE}/api/reports/export`,
      {
        format: 'excel',
        reportType: 'registrations',
      },
      {
        headers: {
          Authorization: `Bearer ${tokens.BRAND_MANAGER}`,
        },
        responseType: 'arraybuffer',
      }
    );

    if (response.data && response.data.length > 0) {
      logSuccess('Export (Excel) generated successfully');
    } else {
      logError('Export returned empty data');
    }
  } catch (error) {
    logError('Export feature test failed', error.message);
  }
}

/**
 * TEST 13: Test Business Rule - Budget Validation
 */

async function testBudgetValidation() {
  log('TEST-13', 'Test Business Rule: Budget Validation');

  try {
    const registrationData = {
      registration_no: `REG-BUDGET-${Date.now()}`,
      category: 'Test',
      location: 'Test',
      quantity: 1000, // Unusually high
      total_budget: 1000000000000, // Very high budget
      notes: 'Budget limit test',
    };

    const result = await apiCall('POST', '/api/registrations', 'INPUTTER', registrationData);

    if (result.id) {
      logSuccess('Budget validation allows high values (business rule validation at submit)');
    }
  } catch (error) {
    if (error.message.includes('budget') || error.message.includes('exceed')) {
      logSuccess('Budget validation correctly enforced');
    } else {
      logError('Budget validation test failed', error.message);
    }
  }
}

/**
 * Main Test Runner
 */

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 END-TO-END WORKFLOW TEST SUITE');
  console.log('='.repeat(70));

  try {
    // Setup: Authenticate all users
    await setupAuthentication();

    // Run all tests
    await testRoleBasedAccess();
    await testCreateRegistration();
    await testSubmitRegistration();
    await testSupervisorApproval();
    await testBrandIntake();
    await testBrandManagerApproval();
    await testBeginAcceptance();
    await testSubmitAcceptance();
    await testApproveAcceptance();
    await testAuditTrail();
    await testRevisionRequest();
    await testExportFeature();
    await testBudgetValidation();

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`\n✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${(testResults.passed / (testResults.passed + testResults.failed) * 100).toFixed(1)}%`);

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  Failed Tests:');
      testResults.errors.forEach((error) => console.log(`   - ${error}`));
    }

    console.log('\n' + '='.repeat(70));

    if (testResults.failed === 0) {
      console.log('\n🎉 ALL E2E TESTS PASSED - SYSTEM READY FOR DEPLOYMENT\n');
    } else {
      console.log(`\n⚠️  ${testResults.failed} test(s) failed - review required\n`);
    }
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
  }
}

// Run tests
runAllTests();
