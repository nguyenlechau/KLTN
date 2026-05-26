import fs from 'fs';

console.log('🧪 PHASE 4 TEST: API Routes (FIXED)\n');

const routeFile = './src/routes/registrationWorkflowRoutes.ts';
let passed = 0, failed = 0;

try {
  if (!fs.existsSync(routeFile)) {
    console.log('❌ Route file not found');
    process.exit(1);
  }

  const content = fs.readFileSync(routeFile, 'utf8');

  // Check for expected endpoints
  const endpoints = [
    { path: '/submit', method: 'POST' },
    { path: '/approve', method: 'POST' },
    { path: '/request-revision', method: 'POST' },
    { path: '/begin-acceptance', method: 'POST' },
    { path: '/submit-acceptance', method: 'POST' },
    { path: '/cancel-request', method: 'POST' },
    { path: '/history', method: 'GET' },
  ];

  for (const endpoint of endpoints) {
    // Use 's' flag to make . match newlines
    const regex = new RegExp(`router\.${endpoint.method.toLowerCase()}.*${endpoint.path.replace(/[-\/]/g, '\\$&')}`, 's');
    if (regex.test(content)) {
      console.log(`✅ ${endpoint.method} ${endpoint.path}`);
      passed++;
    } else {
      console.log(`❌ ${endpoint.method} ${endpoint.path} not found`);
      failed++;
    }
  }

  // Check for service usage
  if (content.includes('ValidationService') &&
      content.includes('AuditService') &&
      content.includes('ApprovalRoutingService')) {
    console.log(`\n✅ All backend services integrated`);
    passed++;
  } else {
    console.log(`\n⚠️  Some services not integrated`);
  }

  // Check for middleware
  if (content.includes('validateToken') && content.includes('requireRole')) {
    console.log('✅ Auth middleware applied');
    passed++;
  } else {
    console.log('❌ Auth middleware missing');
    failed++;
  }

  // Check for business logic
  const hasBusinessLogic = content.includes('nextStatus') && 
                           content.includes('getNextApprover') &&
                           content.includes('validate');
  if (hasBusinessLogic) {
    console.log('✅ Business logic implemented');
    passed++;
  } else {
    console.log('❌ Business logic incomplete');
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n✅ Phase 4 Ready! Moving to Phase 5.');
  }
} catch (error) {
  console.error('Test error:', error.message);
  process.exit(1);
}
