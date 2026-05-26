import dotenv from 'dotenv';

dotenv.config();

import { app } from './app.js';
import { testConnection } from './db/postgres.js';

const port = Number(process.env.PORT || 4000);

async function start() {
  // Test database connection
  console.log('🔌 Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('❌ Failed to connect to database');
    console.error('Make sure PostgreSQL is running and migration has been applied');
    console.error('Run: bash backend/setup-db.sh');
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`✅ Backend running on port ${port}`);
  });
}

start().catch((error) => {
  console.error('❌ Failed to start backend:', error);
  process.exit(1);
});
