// Test accounts for role-based testing
export const TEST_ACCOUNTS = {
  ADMIN: {
    role: 'ADMIN',
    email: 'admin@example.com',
    permissions: ['audit.view', 'channel.view', 'category.view', 'location.view', 'content.view', 'content.create', 'content.update', 'content.clone', 'physical_item.view', 'physical_item.create', 'physical_item.update', 'registration.view', 'registration.create', 'registration.update', 'registration.submit', 'registration.review', 'registration.accept', 'registration.approve', 'registration.complete'],
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiY2hhbm5lbElkcyI6W10sImlhdCI6MTc3NzcxNTk2NywiZXhwIjoxNzc3ODAyMzY3fQ.1YWdqLEPwy0Qheslnn3M4Xf8Pxw3EAzdgUNkXLxJW10',
  },
  REQUESTER: {
    role: 'REQUESTER',
    email: 'requester@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'content.create', 'content.update', 'content.clone', 'physical_item.view', 'registration.view', 'registration.create', 'registration.update', 'registration.submit'],
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItcmVxdWVzdGVyIiwiZW1haWwiOiJyZXF1ZXN0ZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiUkVRVUVTVEVSIiwiY2hhbm5lbElkcyI6W10sImlhdCI6MTc3NzcxNTk2NywiZXhwIjoxNzc3ODAyMzY3fQ.alCrYnpjqHCVgsKqGLmutIRk3oidmvuUQ5HSKphp47Y',
  },
  CENTRAL_REQUESTER: {
    role: 'CENTRAL_REQUESTER',
    email: 'central-requester@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'content.create', 'content.update', 'content.clone', 'physical_item.view', 'registration.view', 'registration.create', 'registration.update', 'registration.submit'],
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItY2VudHJhbF9yZXF1ZXN0ZXIiLCJlbWFpbCI6ImNlbnRyYWwtcmVxdWVzdGVyQGV4YW1wbGUuY29tIiwicm9sZSI6IkNFTlRSQUxfUkVRVUVTVEVSIiwiY2hhbm5lbElkcyI6W10sImlhdCI6MTc3NzcxNTk2NywiZXhwIjoxNzc3ODAyMzY3fQ.l6_tczAdiVHD3vVD6okLMi0xodBMiMPWFEQxjDWGumU',
  },
  SUPERVISOR: {
    role: 'SUPERVISOR',
    email: 'supervisor@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'physical_item.view', 'registration.view', 'registration.review', 'audit.view'],
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItc3VwZXJ2aXNvciIsImVtYWlsIjoic3VwZXJ2aXNvckBleGFtcGxlLmNvbSIsInJvbGUiOiJTVVBFUlZJU09SIiwiY2hhbm5lbElkcyI6W10sImlhdCI6MTc3NzcxNTk2NywiZXhwIjoxNzc3ODAyMzY3fQ.ljr_Nt8Gjfc3Y8E5eUld0ly1RkqdLLXSpfCjJPsDcrY',
  },
  CENTRAL_SUPERVISOR: {
    role: 'CENTRAL_SUPERVISOR',
    email: 'central-supervisor@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'physical_item.view', 'registration.view', 'registration.review', 'audit.view'],
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItY2VudHJhbF9zdXBlcnZpc29yIiwiZW1haWwiOiJjZW50cmFsLXN1cGVydmlzb3JAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ0VOVFJBTF9TVVBFUlZJU09SIiwiY2hhbm5lbElkcyI6W10sImlhdCI6MTc3NzcxNTk2NywiZXhwIjoxNzc3ODAyMzY3fQ.EdgNODp7NeQsWqTzDs-OXIf-EHhbV3EZNL_rTQHsIsU',
  },
  OPERATIONS_SPECIALIST: {
    role: 'OPERATIONS_SPECIALIST',
    email: 'operations-specialist@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'physical_item.view', 'physical_item.create', 'physical_item.update', 'registration.view', 'registration.review', 'registration.accept', 'audit.view'],
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItb3BlcmF0aW9uc19zcGVjaWFsaXN0IiwiZW1haWwiOiJvcGVyYXRpb25zLXNwZWNpYWxpc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiT1BFUkFUSU9OU19TUEVDSUFMSVNUIiwiY2hhbm5lbElkcyI6W10sImlhdCI6MTc3NzcxNTk2NywiZXhwIjoxNzc3ODAyMzY3fQ.pYL46Gqct1v8gmbWJ9Qo-tDZcdgfSPKyIGzZcltae6g',
  },
  OPERATIONS_MANAGER: {
    role: 'OPERATIONS_MANAGER',
    email: 'operations-manager@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'physical_item.view', 'registration.view', 'registration.approve', 'registration.complete', 'audit.view'],
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItb3BlcmF0aW9uc19tYW5hZ2VyIiwiZW1haWwiOiJvcGVyYXRpb25zLW1hbmFnZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiT1BFUkFUSU9OU19NQU5BR0VSIiwiY2hhbm5lbElkcyI6W10sImlhdCI6MTc3NzcxNTk2NywiZXhwIjoxNzc3ODAyMzY3fQ.VJ9i7XjSmGra9ju-1Cpm5bebhy6Wfw9Tpu46H08ATb0',
  },
};

export function setTestAccount(role: keyof typeof TEST_ACCOUNTS) {
  const account = TEST_ACCOUNTS[role];
  localStorage.setItem('access_token', account.token);
  localStorage.setItem('user_role', role);
  console.log(`✅ Logged in as ${role} (${account.email})`);
  console.log(`Permissions: ${account.permissions.join(', ')}`);
  // Refresh page to load new permissions
  window.location.reload();
}

export function getCurrentAccount() {
  const role = localStorage.getItem('user_role');
  return role ? TEST_ACCOUNTS[role as keyof typeof TEST_ACCOUNTS] : null;
}

export function logoutTestAccount() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  console.log('✅ Logged out');
  window.location.reload();
}
