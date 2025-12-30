/**
 * Database Module
 * 
 * Manages SQLite database connection and initialization.
 * Uses better-sqlite3 for synchronous database operations.
 */

// Use require for CommonJS compatibility with better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');

// Determine database path - use in-memory for tests and development, file-based for production
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction ? path.join(process.cwd(), 'data', 'fire.db') : ':memory:';

export const db = new (Database as any)(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 * Creates all necessary tables if they don't exist
 */
export function initializeDatabase() {
  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plaid_account_id TEXT,
      name TEXT NOT NULL,
      type TEXT,
      subtype TEXT,
      balance REAL,
      currency TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT,
      category_id INTEGER,
      plaid_transaction_id TEXT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      pending BOOLEAN DEFAULT 0,
      plaid_category TEXT,
      plaid_primary_category TEXT,
      merchant_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Budgets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category_id, month, year),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
    ON transactions(user_id, date);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_category 
    ON transactions(category_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_budgets_user_month 
    ON budgets(user_id, month, year);
  `);

  console.log('Database initialized successfully');
}

/**
 * Seed database with sample data (development only)
 */
export function seedDatabase() {
  try {
    // Insert sample user first
    const userInsert = db.prepare(
      'INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)'
    );
    userInsert.run('user-demo', 'demo@example.com', 'Demo User');

    // Insert sample account
    const accountInsert = db.prepare(
      'INSERT OR IGNORE INTO accounts (id, user_id, name, type) VALUES (?, ?, ?, ?)'
    );
    accountInsert.run('account-demo', 'user-demo', 'Demo Checking', 'depository');

    // Insert sample categories
    const categories = [
      'Groceries',
      'Dining Out',
      'Transportation',
      'Entertainment',
      'Utilities',
      'Shopping',
      'Healthcare',
      'Other'
    ];

    const categoryInsert = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    
    categories.forEach((cat) => {
      categoryInsert.run(cat);
    });

    // Insert sample budgets for user
    const budgetInsert = db.prepare(
      'INSERT OR IGNORE INTO budgets (user_id, category_id, month, year, amount) VALUES (?, ?, ?, ?, ?)'
    );

    const categoryByName = db.prepare('SELECT id FROM categories WHERE name = ?');
    
    const budgets = [
      { name: 'Groceries', month: 1, year: 2025, amount: 300 },
      { name: 'Dining Out', month: 1, year: 2025, amount: 200 },
      { name: 'Transportation', month: 1, year: 2025, amount: 150 },
      { name: 'Entertainment', month: 1, year: 2025, amount: 100 },
      { name: 'Utilities', month: 1, year: 2025, amount: 120 }
    ];

    budgets.forEach((budget) => {
      const category = categoryByName.get(budget.name) as any;
      if (category) {
        budgetInsert.run('user-demo', category.id, budget.month, budget.year, budget.amount);
      }
    });

    // Insert sample transactions
    const transactionInsert = db.prepare(
      'INSERT OR IGNORE INTO transactions (id, user_id, account_id, category_id, name, amount, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const transactions = [
      { name: 'Whole Foods', category: 'Groceries', amount: -150, day: 1 },
      { name: 'Trader Joe\'s', category: 'Groceries', amount: -85, day: 5 },
      { name: 'Olive Garden', category: 'Dining Out', amount: -45, day: 10 },
      { name: 'Uber', category: 'Transportation', amount: -25, day: 8 },
      { name: 'Movie Tickets', category: 'Entertainment', amount: -30, day: 12 }
    ];

    transactions.forEach((transaction, index) => {
      const category = categoryByName.get(transaction.category) as any;
      if (category) {
        const transactionId = `txn-demo-${index}`;
        const date = `2025-01-${String(transaction.day).padStart(2, '0')}`;
        transactionInsert.run(
          transactionId,
          'user-demo',
          'account-demo',
          category.id,
          transaction.name,
          transaction.amount,
          date
        );
      }
    });

    console.log('Database seeded with sample data');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export default db;
