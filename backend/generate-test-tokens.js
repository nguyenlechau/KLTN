import jwt from 'jsonwebtoken';

const JWT_SECRET = 'replace_me_in_prod';
const roles = [
  'REQUESTER',
  'CENTRAL_REQUESTER',
  'SUPERVISOR',
  'CENTRAL_SUPERVISOR',
  'OPERATIONS_SPECIALIST',
  'OPERATIONS_MANAGER',
];

console.log('=== TEST TOKENS FOR EACH ROLE ===\n');

roles.forEach((role) => {
  const payload = {
    sub: `test-user-${role.toLowerCase()}`,
    email: `${role.toLowerCase()}@example.com`,
    role,
    channelIds: [],
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
  console.log(`\n${role}:`);
  console.log(`Token: ${token}`);
  console.log(`Bearer: Bearer ${token}`);
  console.log(`localStorage: localStorage.setItem('access_token', '${token}');`);
});

console.log('\n\n=== QUICK COPY-PASTE FOR localStorage ===\n');
roles.forEach((role) => {
  const payload = {
    sub: `test-user-${role.toLowerCase()}`,
    email: `${role.toLowerCase()}@example.com`,
    role,
    channelIds: [],
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
  console.log(`// ${role}`);
  console.log(`localStorage.setItem('access_token', '${token}');\n`);
});
