// Test accounts for role-based testing
export const TEST_ACCOUNTS = {
  ADMIN: {
    role: 'ADMIN',
    email: 'admin@example.com',
    permissions: ['audit.view', 'channel.view', 'channel.create', 'channel.update', 'category.view', 'category.create', 'category.update', 'location.view', 'location.create', 'location.update', 'content.view', 'content.create', 'content.update', 'content.clone', 'physical_item.view', 'physical_item.create', 'physical_item.update', 'registration.view', 'registration.create', 'registration.update', 'registration.submit', 'registration.review', 'registration.accept', 'registration.approve', 'registration.complete'],
  },
  INPUTTER: {
    role: 'INPUTTER',
    email: 'inputter@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'content.create', 'content.update', 'content.clone', 'physical_item.view', 'registration.view', 'registration.create', 'registration.update', 'registration.submit'],
  },
  INPUTTER_HO: {
    role: 'INPUTTER_HO',
    email: 'inputter-ho@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'content.create', 'content.update', 'content.clone', 'physical_item.view', 'registration.view', 'registration.create', 'registration.update', 'registration.submit'],
  },
  APPROVER: {
    role: 'APPROVER',
    email: 'approver@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'physical_item.view', 'registration.view', 'registration.review', 'audit.view'],
  },
  APPROVER_HO: {
    role: 'APPROVER_HO',
    email: 'approver-ho@example.com',
    permissions: ['channel.view', 'category.view', 'location.view', 'content.view', 'physical_item.view', 'registration.view', 'registration.review', 'audit.view'],
  },
  BRAND: {
    role: 'BRAND',
    email: 'brand@example.com',
    permissions: ['audit.view', 'channel.view', 'channel.create', 'channel.update', 'category.view', 'category.create', 'category.update', 'location.view', 'location.create', 'location.update', 'content.view', 'content.create', 'content.update', 'content.clone', 'physical_item.view', 'physical_item.create', 'physical_item.update', 'registration.view', 'registration.create', 'registration.update', 'registration.accept'],
  },
  BRAND_MANAGER: {
    role: 'BRAND_MANAGER',
    email: 'brand-manager@example.com',
    permissions: ['audit.view', 'channel.view', 'category.view', 'location.view', 'content.view', 'physical_item.view', 'registration.view', 'registration.approve', 'registration.complete'],
  },
};

export function setTestAccount(role: keyof typeof TEST_ACCOUNTS) {
  const account = TEST_ACCOUNTS[role];
  localStorage.setItem('access_token', '');
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
