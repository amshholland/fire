/**
 * Database Initialization and Connection
 * 
 * Manages SQLite database connection and schema initialization.
 * Uses in-memory database that resets on server restart.
 */

import Database from 'better-sqlite3';
import {
  CREATE_USER_TABLE,
  CREATE_ACCOUNT_TABLE,
  CREATE_TRANSACTION_TABLE,
  CREATE_CATEGORY_TABLE,
  CREATE_BUDGET_TABLE,
  CREATE_ASSET_LIABILITY_TABLE,
  CREATE_INDEXES,
  SYSTEM_CATEGORIES
} from './schema';

let dbInstance: Database.Database | null = null;

/**
 * Initialize and return database connection
 * Creates all tables and seeds system data
 * 
 * @returns SQLite database instance
 */
export function initializeDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Create in-memory database (resets on server restart)
  const db = new Database(':memory:');
  
  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');

  // Create all tables
  db.exec(CREATE_USER_TABLE);
  db.exec(CREATE_ACCOUNT_TABLE);
  db.exec(CREATE_TRANSACTION_TABLE);
  db.exec(CREATE_CATEGORY_TABLE);
  db.exec(CREATE_BUDGET_TABLE);
  db.exec(CREATE_ASSET_LIABILITY_TABLE);
  db.exec(CREATE_INDEXES);

  // Seed system categories (global, account_id = NULL)
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, is_system, account_id) VALUES (?, 1, NULL)'
  );

  for (const categoryName of SYSTEM_CATEGORIES) {
    insertCategory.run(categoryName);
  }

  console.log('Database initialized successfully');
  
  dbInstance = db;
  return db;
}

/**
 * Get existing database instance
 * Throws error if database not initialized
 * 
 * @returns SQLite database instance
 */
export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

/**
 * Close database connection
 * Used primarily in tests and shutdown
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('Database connection closed');
  }
}
