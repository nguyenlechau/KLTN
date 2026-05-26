import { Pool } from 'pg';
import { mockDb } from './mock.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cms_physical_ads';

let db: any;
let usingMockDb = false;

try {
  console.log('[DB] Attempting to connect to:', connectionString);
  db = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Wrap query to fall back to mock if connection fails
  const originalQuery = db.query.bind(db);
  const originalConnect = db.connect.bind(db);
  db.query = async function(...args: any[]) {
    if (usingMockDb) {
      return mockDb.query(args[0], args[1]);
    }

    try {
      const result = await originalQuery(...args);
      if (!usingMockDb) {
        console.log('[DB] Real database query successful');
      }
      return result;
    } catch (err: any) {
      console.warn('[DB] ⚠️  Database query failed, falling back to mock database:', err.message);
      usingMockDb = true;
      return mockDb.query(args[0], args[1]);
    }
  };

  db.connect = async function(...args: any[]) {
    if (usingMockDb) {
      return {
        query: async (...queryArgs: any[]) => mockDb.query(queryArgs[0], queryArgs[1]),
        release: () => {},
      };
    }

    try {
      return await originalConnect(...args);
    } catch (err: any) {
      console.warn('[DB] ⚠️  Database connect failed, falling back to mock client:', err.message);
      usingMockDb = true;
      return {
        query: async (...queryArgs: any[]) => mockDb.query(queryArgs[0], queryArgs[1]),
        release: () => {},
      };
    }
  };

  // Handle connection errors gracefully
  db.on('error', (err: any) => {
    console.error('[DB] Pool error:', err.message);
  });
} catch (err: any) {
  console.warn('[DB] ⚠️  Could not create database pool, using mock database:', err.message);
  usingMockDb = true;
  db = mockDb;
}

export { db };
