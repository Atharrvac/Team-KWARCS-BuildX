import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.js';
import dotenv from 'dotenv';

// Load env first
dotenv.config();

// Create PostgreSQL connection pool only if DATABASE_URL is provided
let pool = null;
let db = null;
let dbConnected = false;

const dbUrl = process.env.DATABASE_URL;
console.log('🔍 DATABASE_URL found:', dbUrl ? 'Yes' : 'No');

// Create pool for any valid DATABASE_URL (including localhost for development)
if (dbUrl) {
  const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  
  pool = new Pool({
    connectionString: dbUrl,
    // Only use SSL for remote databases
    ...(isLocalhost ? {} : { ssl: { rejectUnauthorized: false } }),
  });
  
  // Create Drizzle instance
  db = drizzle(pool, { schema });
  console.log(`🔧 Database pool created for ${isLocalhost ? 'local' : 'remote'} database`);
}

// Test connection
export const testConnection = async () => {
  if (!process.env.DATABASE_URL || !pool) {
    console.log('⚠️  No DATABASE_URL configured - using mock data');
    dbConnected = false;
    return false;
  }
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    dbConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Falling back to mock data mode');
    dbConnected = false;
    // Don't set db to null - keep it for potential reconnection
    return false;
  }
};

// Check if database is actually connected
export const isDbConnected = () => dbConnected;

// Helper function to check if database is available and connected
export const isDatabaseAvailable = () => {
  return db !== null && dbConnected;
};

// Helper function to safely execute database operations
export const safeDbOperation = async (operation, fallback = null) => {
  if (!isDatabaseAvailable()) {
    return fallback;
  }
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation error:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeConnection = async () => {
  if (pool) {
    await pool.end();
    console.log('Database connection pool closed');
  }
};

export { db };
export default db;
