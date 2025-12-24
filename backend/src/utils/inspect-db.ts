/**
 * Database Inspection Utility
 * 
 * Run this to view all data currently in the database
 * Usage: tsx src/utils/inspect-db.ts
 */

import { initializeDatabase } from '../database/database';
import { getAllUsers } from '../data-access/user-dal';
import { getDatabase } from '../database/database';

// Initialize database
initializeDatabase();
const db = getDatabase();

console.log('\n========================================');
console.log('DATABASE CONTENTS');
console.log('========================================\n');

// Users
console.log('📊 USERS:');
const users = getAllUsers();
if (users.length === 0) {
  console.log('  (empty)');
} else {
  users.forEach(user => {
    console.log(`  - ID: ${user.id}`);
    console.log(`    Email: ${user.email}`);
    console.log(`    Google ID: ${user.google_id || 'null'}`);
    console.log(`    Auth Provider: ${user.auth_provider}`);
    console.log(`    Has Linked Plaid: ${user.has_linked_plaid}`);
    console.log(`    Onboarding Complete: ${user.onboarding_completed}`);
    console.log(`    Created: ${user.created_at}\n`);
  });
}

// Accounts
console.log('\n💰 ACCOUNTS:');
const accounts = db.prepare('SELECT * FROM accounts').all();
if (accounts.length === 0) {
  console.log('  (empty)');
} else {
  accounts.forEach((acc: any) => {
    console.log(`  - ID: ${acc.id} | Name: ${acc.name}`);
    console.log(`    User ID: ${acc.user_id}`);
    console.log(`    Type: ${acc.type}/${acc.subtype || 'N/A'}`);
    console.log(`    Balance: $${acc.current_balance}`);
    console.log(`    Institution: ${acc.institution || 'N/A'}`);
    console.log(`    Plaid ID: ${acc.plaid_account_id || 'N/A'}\n`);
  });
}

// Transactions
console.log('\n💸 TRANSACTIONS:');
const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC LIMIT 20').all();
if (transactions.length === 0) {
  console.log('  (empty)');
} else {
  console.log(`  (showing last 20 of ${(db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any).count})`);
  transactions.forEach((tx: any) => {
    console.log(`  - ID: ${tx.id} | Date: ${tx.date} | Amount: $${tx.amount}`);
    console.log(`    Merchant: ${tx.merchant || 'N/A'}`);
    console.log(`    Account ID: ${tx.account_id} | Category ID: ${tx.category_id || 'N/A'}`);
    console.log(`    Manual: ${tx.is_manual ? 'Yes' : 'No'} | Plaid ID: ${tx.plaid_transaction_id || 'N/A'}\n`);
  });
}

// Categories
console.log('\n📁 CATEGORIES:');
const categories = db.prepare('SELECT * FROM categories ORDER BY is_system DESC, name').all();
console.log(`  System categories: ${categories.filter((c: any) => c.is_system).length}`);
console.log(`  Custom categories: ${categories.filter((c: any) => !c.is_system).length}`);
categories.forEach((cat: any) => {
  console.log(`  - ID: ${cat.id} | ${cat.name} ${cat.is_system ? '(system)' : '(custom)'}`);
});

// Budgets
console.log('\n💵 BUDGETS:');
const budgets = db.prepare('SELECT * FROM budgets').all();
if (budgets.length === 0) {
  console.log('  (empty)');
} else {
  budgets.forEach((budget: any) => {
    console.log(`  - ${budget.month}/${budget.year} | Category ID: ${budget.category_id} | Amount: $${budget.amount}`);
  });
}

// Assets/Liabilities
console.log('\n🏠 ASSETS & LIABILITIES:');
const assetsLiabilities = db.prepare('SELECT * FROM assets_liabilities').all();
if (assetsLiabilities.length === 0) {
  console.log('  (empty)');
} else {
  assetsLiabilities.forEach((item: any) => {
    console.log(`  - ${item.name} (${item.type}) | Value: $${item.value}`);
  });
}

console.log('\n========================================\n');
