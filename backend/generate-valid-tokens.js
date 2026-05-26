import jwt from 'jsonwebtoken';

const JWT_SECRET = 'replace_me_in_prod'; // Must match backend JWT_SECRET

const roles = ['ADMIN', 'REQUESTER', 'CENTRAL_REQUESTER', 'SUPERVISOR', 'CENTRAL_SUPERVISOR', 'OPERATIONS_SPECIALIST', 'OPERATIONS_MANAGER'];

const tokens = {};

roles.forEach(role => {
  const payload = {
    sub: `test-user-${role.toLowerCase()}`,
    email: `${role.toLowerCase().replace(/_/g, '-')}@example.com`,
    role: role,
    channelIds: [],
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  tokens[role] = {
    email: payload.email,
    token: token,
    command: `localStorage.setItem('access_token', '${token}'); localStorage.setItem('user_role', '${role}'); location.reload();`
  };
});

console.log('=== VALID TEST TOKENS ===\n');
Object.entries(tokens).forEach(([role, data]) => {
  console.log(`\n## ${role}`);
  console.log(`Email: ${data.email}`);
  console.log(`Token: ${data.token}`);
  console.log(`\nConsole Command:`);
  console.log(data.command);
});

console.log('\n\n=== UPDATE testAccounts.ts ===\n');
console.log('export const TEST_ACCOUNTS = {');
Object.entries(tokens).forEach(([role, data], idx) => {
  const email = data.email;
  console.log(`  ${role}: {
    role: '${role}',
    email: '${email}',
    permissions: [],
    token: '${data.token}',
  },${idx < Object.keys(tokens).length - 1 ? '' : ''}`);
});
console.log('};');
