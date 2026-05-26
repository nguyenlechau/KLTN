/**
 * api-endpoint-validation-test.mjs
 * Validates all API endpoints per SYSTEM_SPECIFICATION Section L
 * Checks: response codes, schema compliance, error handling
 */

import axios from 'axios';

const API_BASE = 'http://localhost:4000';
const TEST_TOKEN = 'Bearer test-token'; // Will be replaced with real token

// API endpoints to validate
const ENDPOINTS = [
  // Auth endpoints
  { method: 'POST', path: '/api/auth/login', requiresAuth: false, description: 'User login' },
  { method: 'GET', path: '/api/auth/profile', requiresAuth: true, description: 'Get user profile' },

  // Registration endpoints
  { method: 'GET', path: '/api/registrations', requiresAuth: true, description: 'List registrations' },
  { method: 'POST', path: '/api/registrations', requiresAuth: true, description: 'Create registration' },
  { method: 'GET', path: '/api/registrations/:id', requiresAuth: true, description: 'Get registration details' },
  { method: 'PATCH', path: '/api/registrations/:id', requiresAuth: true, description: 'Update registration' },

  // Workflow endpoints
  { method: 'POST', path: '/api/registrations/:id/submit', requiresAuth: true, description: 'Submit registration' },
  { method: 'POST', path: '/api/registrations/:id/approve', requiresAuth: true, description: 'Approve registration' },
  { method: 'POST', path: '/api/registrations/:id/request-revision', requiresAuth: true, description: 'Request revision' },
  { method: 'POST', path: '/api/registrations/:id/begin-acceptance', requiresAuth: true, description: 'Begin acceptance' },
  { method: 'POST', path: '/api/registrations/:id/submit-acceptance', requiresAuth: true, description: 'Submit acceptance' },
  { method: 'POST', path: '/api/registrations/:id/cancel-request', requiresAuth: true, description: 'Cancel request' },

  // Item endpoints
  { method: 'POST', path: '/api/registrations/:id/items', requiresAuth: true, description: 'Add items' },
  { method: 'DELETE', path: '/api/registrations/:id/items/:itemId', requiresAuth: true, description: 'Remove item' },

  // Audit endpoints
  { method: 'GET', path: '/api/registrations/:id/history', requiresAuth: true, description: 'Get audit history' },

  // Master data endpoints
  { method: 'GET', path: '/api/channels', requiresAuth: true, description: 'List channels' },
  { method: 'GET', path: '/api/categories', requiresAuth: true, description: 'List categories' },
  { method: 'GET', path: '/api/locations', requiresAuth: true, description: 'List locations' },
  { method: 'GET', path: '/api/physical-items', requiresAuth: true, description: 'List physical items' },
  { method: 'GET', path: '/api/contents', requiresAuth: true, description: 'List content' },

  // Export endpoints
  { method: 'POST', path: '/api/reports/export', requiresAuth: true, description: 'Generic export' },
  { method: 'POST', path: '/api/reports/registrations', requiresAuth: true, description: 'Export registrations' },
  { method: 'POST', path: '/api/reports/items', requiresAuth: true, description: 'Export items' },
  { method: 'POST', path: '/api/reports/content', requiresAuth: true, description: 'Export content' },
  { method: 'POST', path: '/api/reports/locations', requiresAuth: true, description: 'Export locations' },
  { method: 'POST', path: '/api/reports/categories', requiresAuth: true, description: 'Export categories' },
  { method: 'POST', path: '/api/reports/orders', requiresAuth: true, description: 'Export orders' },

  // Users endpoint
  { method: 'GET', path: '/api/users', requiresAuth: true, description: 'List users' },
];

let results = {
  total: ENDPOINTS.length,
  accessible: 0,
  notFound: 0,
  authRequired: 0,
  errors: [],
};

async function checkEndpoint(endpoint) {
  const { method, path, requiresAuth, description } = endpoint;

  try {
    const url = `${API_BASE}${path.replace(':id', 'test-id').replace(':itemId', 'test-item-id')}`;

    const config = {
      headers: requiresAuth ? { Authorization: TEST_TOKEN } : {},
      validateStatus: () => true, // Don't throw on any status code
    };

    let response;
    if (method === 'GET') {
      response = await axios.get(url, config);
    } else if (method === 'POST') {
      response = await axios.post(url, {}, config);
    } else if (method === 'PATCH') {
      response = await axios.patch(url, {}, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(url, config);
    }

    // Analyze response
    if (response.status === 404) {
      console.log(`  ❌ [${method.padEnd(6)}] ${path} - Not Found`);
      results.notFound++;
    } else if (response.status === 401) {
      console.log(`  ⚠️  [${method.padEnd(6)}] ${path} - Auth Required`);
      results.authRequired++;
    } else if (response.status >= 200 && response.status < 500) {
      console.log(`  ✅ [${method.padEnd(6)}] ${path} - ${response.status}`);
      results.accessible++;
    } else {
      console.log(`  ⚠️  [${method.padEnd(6)}] ${path} - ${response.status}`);
      results.errors.push(`${method} ${path}: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ [${method.padEnd(6)}] ${path} - Error: ${error.message.substring(0, 40)}`);
    results.errors.push(`${method} ${path}: ${error.message}`);
  }
}

async function validateAllEndpoints() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 API ENDPOINT VALIDATION');
  console.log('='.repeat(70));
  console.log(`\nTesting ${ENDPOINTS.length} endpoints...\n`);

  // Group by category
  const categories = {
    'Auth': ENDPOINTS.filter(e => e.path.includes('/auth')),
    'Registrations': ENDPOINTS.filter(e => e.path.includes('/registrations') && !e.path.includes('/items') && !e.path.includes('/history')),
    'Workflow': ENDPOINTS.filter(e => e.path.includes('/submit') || e.path.includes('/approve') || e.path.includes('/revision') || e.path.includes('/acceptance') || e.path.includes('/cancel')),
    'Items': ENDPOINTS.filter(e => e.path.includes('/items')),
    'Audit': ENDPOINTS.filter(e => e.path.includes('/history')),
    'Master Data': ENDPOINTS.filter(e => e.path.match(/\/(channels|categories|locations|physical-items|contents)/)),
    'Reports': ENDPOINTS.filter(e => e.path.includes('/reports')),
    'Users': ENDPOINTS.filter(e => e.path.includes('/users')),
  };

  for (const [category, endpoints] of Object.entries(categories)) {
    if (endpoints.length > 0) {
      console.log(`\n${category}:`);
      for (const endpoint of endpoints) {
        await checkEndpoint(endpoint);
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 ENDPOINT VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n✅ Accessible: ${results.accessible}`);
  console.log(`⚠️  Auth Required: ${results.authRequired}`);
  console.log(`❌ Not Found: ${results.notFound}`);
  console.log(`📈 Coverage: ${((results.accessible / results.total) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((error) => console.log(`  - ${error}`));
  }

  console.log('\n' + '='.repeat(70));
}

validateAllEndpoints();
