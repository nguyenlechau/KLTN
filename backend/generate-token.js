import jwt from 'jsonwebtoken';

const payload = {
  sub: 'test-user-1',
  email: 'test@example.com',
  role: 'ADMIN',
  channelIds: []
};

const token = jwt.sign(payload, 'replace_me_in_prod', { expiresIn: '12h' });
console.log('Bearer ' + token);
