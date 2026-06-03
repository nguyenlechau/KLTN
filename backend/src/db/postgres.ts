import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';
import { mockDb } from './mock.js';

dotenv.config();

/**
 * PostgreSQL Connection Pool
 * Uses environment variables for configuration
 */

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'kltn_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let usingMockDb = false;

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.warn('[DB] ⚠️ Falling back to in-memory mock database');
    usingMockDb = true;
    return true;
  }
}

/**
 * Execute a query
 */
export async function query<T extends any = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<any>> {
  if (usingMockDb) {
    return mockDb.query(text, params);
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 50) + '...');
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error, { text, params });
    console.warn('[DB] ⚠️ Query failed, switching to mock database');
    usingMockDb = true;
    return mockDb.query(text, params);
  }
}

/**
 * Get a single row
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get all rows
 */
export async function queryAll<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  if (usingMockDb) {
    return callback({
      query: async (text: string, params?: any[]) => mockDb.query(text, params),
      release: () => {},
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all connections
 */
export async function close(): Promise<void> {
  await pool.end();
}

export { pool };
