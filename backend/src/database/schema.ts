/**
 * Database Schema Definitions
 * 
 * Defines SQLite database schema for the financial management application.
 * Uses in-memory database that resets on server restart.
 */

/**
 * User Table Schema
 * 
 * Stores user account information and onboarding state.
 * - id: Unique identifier for the user (UUID format)
 * - email: User's email address (unique, used for authentication)
 * - google_id: Google's unique user identifier from OAuth (nullable for non-Google users)
 * - auth_provider: Authentication method used ('google', 'local', etc.)
 * - created_at: Timestamp when user account was created
 * - has_linked_plaid: Boolean flag indicating if user has connected Plaid account
 * - onboarding_completed: Boolean flag indicating if user has finished onboarding flow
 */
export const CREATE_USER_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    google_id TEXT UNIQUE,
    auth_provider TEXT DEFAULT 'local',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    has_linked_plaid INTEGER DEFAULT 0,
    onboarding_completed INTEGER DEFAULT 0
  )
`;

/**
 * Account Table Schema
 * 
 * Stores bank/financial accounts linked via Plaid or added manually.
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key reference to users table
 * - plaid_account_id: Plaid's unique identifier for this account (nullable for manual accounts)
 * - name: Display name for the account (e.g., "Chase Checking")
 * - type: Account type (e.g., "depository", "credit", "investment")
 * - subtype: More specific account type (e.g., "checking", "savings", "credit card")
 * - current_balance: Current account balance in dollars
 * - institution: Name of the financial institution (e.g., "Chase", "Wells Fargo")
 */
export const CREATE_ACCOUNT_TABLE = `
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    plaid_account_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subtype TEXT,
    current_balance REAL DEFAULT 0,
    institution TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;

/**
 * Transaction Table Schema
 * 
 * Stores financial transactions from Plaid or manually entered by user.
 * Supports both automated Plaid sync and manual transaction entry.
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key reference to users table
 * - account_id: Foreign key reference to accounts table
 * - plaid_transaction_id: Plaid's unique identifier (nullable for manual transactions, unique constraint to avoid duplicates)
 * - date: Transaction date
 * - amount: Transaction amount (positive for income, negative for expenses)
 * - merchant: Merchant or transaction description
 * - category_id: Foreign key reference to categories table (nullable if uncategorized)
 * - is_manual: Boolean flag indicating if transaction was manually entered (vs. synced from Plaid)
 */
export const CREATE_TRANSACTION_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    account_id INTEGER NOT NULL,
    plaid_transaction_id TEXT UNIQUE,
    date DATE NOT NULL,
    amount REAL NOT NULL,
    merchant TEXT,
    category_id INTEGER,
    is_manual INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  )
`;

/**
 * Category Table Schema
 * 
 * Stores transaction categories (both system-defined and user-custom).
 * - id: Auto-incrementing primary key
 * - name: Category name (e.g., "Groceries", "Entertainment")
 * - is_system: Boolean flag indicating if this is a system-defined category (cannot be deleted by user)
 * - user_id: Foreign key reference to users table (nullable for system categories, required for user-custom categories)
 */
export const CREATE_CATEGORY_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_system INTEGER DEFAULT 0,
    user_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;

/**
 * Budget Table Schema
 * 
 * Stores monthly budget allocations per category for each user.
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key reference to users table
 * - category_id: Foreign key reference to categories table
 * - month: Budget month (1-12)
 * - year: Budget year
 * - amount: Budgeted amount for this category/month/year
 */
export const CREATE_BUDGET_TABLE = `
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(user_id, category_id, month, year)
  )
`;

/**
 * Asset/Liability Table Schema
 * 
 * Stores manually tracked assets and liabilities (e.g., real estate, vehicles, loans).
 * Separate from accounts for things not tracked via Plaid.
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key reference to users table
 * - name: Asset/liability name (e.g., "House", "Car Loan")
 * - type: Either "asset" or "liability"
 * - value: Current value in dollars (positive for assets, positive value for liabilities)
 * - is_manual: Boolean flag indicating manual entry (always true for this table)
 */
export const CREATE_ASSET_LIABILITY_TABLE = `
  CREATE TABLE IF NOT EXISTS assets_liabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('asset', 'liability')),
    value REAL NOT NULL,
    is_manual INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;

/**
 * Index Definitions for Query Performance
 * 
 * Creates indexes on frequently queried columns to improve performance.
 */
export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id ON transactions(plaid_transaction_id);
  CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
  CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
  CREATE INDEX IF NOT EXISTS idx_assets_liabilities_user_id ON assets_liabilities(user_id);
`;

/**
 * System Categories Seed Data
 * 
 * Default categories provided to all users.
 */
export const SYSTEM_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills & Utilities',
  'Healthcare',
  'Insurance',
  'Education',
  'Personal Care',
  'Income',
  'Other'
];
