/**
 * Account Data Access Layer
 * 
 * Handles all database operations for Account entity.
 * Manages both Plaid-linked and manual accounts.
 */

import { getDatabase } from '../database/database';

export interface Account {
  id: number;
  user_id: string;
  plaid_account_id: string | null;
  name: string;
  type: string;
  subtype: string | null;
  current_balance: number;
  institution: string | null;
}

export interface CreateAccountParams {
  user_id: string;
  plaid_account_id?: string | null;
  name: string;
  type: string;
  subtype?: string | null;
  current_balance?: number;
  institution?: string | null;
}

/**
 * Create a new account
 * 
 * @param params - Account creation parameters
 * @returns Created account object
 */
export function createAccount(params: CreateAccountParams): Account {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO accounts (user_id, plaid_account_id, name, type, subtype, current_balance, institution)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    params.user_id,
    params.plaid_account_id || null,
    params.name,
    params.type,
    params.subtype || null,
    params.current_balance || 0,
    params.institution || null
  );
  
  return getAccountById(Number(result.lastInsertRowid))!;
}

/**
 * Get account by ID
 * 
 * @param id - Account ID
 * @returns Account object or undefined if not found
 */
export function getAccountById(id: number): Account | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    user_id: row.user_id,
    plaid_account_id: row.plaid_account_id,
    name: row.name,
    type: row.type,
    subtype: row.subtype,
    current_balance: row.current_balance,
    institution: row.institution
  };
}

/**
 * Get all accounts for a user
 * 
 * @param userId - User UUID
 * @returns Array of user's accounts
 */
export function getAccountsByUserId(userId: string): Account[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM accounts WHERE user_id = ? ORDER BY name');
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    plaid_account_id: row.plaid_account_id,
    name: row.name,
    type: row.type,
    subtype: row.subtype,
    current_balance: row.current_balance,
    institution: row.institution
  }));
}

/**
 * Get account by Plaid account ID
 * 
 * @param plaidAccountId - Plaid's unique account identifier
 * @returns Account object or undefined if not found
 */
export function getAccountByPlaidId(plaidAccountId: string): Account | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM accounts WHERE plaid_account_id = ?');
  const row = stmt.get(plaidAccountId) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    user_id: row.user_id,
    plaid_account_id: row.plaid_account_id,
    name: row.name,
    type: row.type,
    subtype: row.subtype,
    current_balance: row.current_balance,
    institution: row.institution
  };
}

/**
 * Update account balance
 * 
 * @param accountId - Account ID
 * @param newBalance - New balance amount
 * @returns Updated account object
 */
export function updateAccountBalance(accountId: number, newBalance: number): Account | undefined {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE accounts SET current_balance = ? WHERE id = ?');
  
  stmt.run(newBalance, accountId);
  
  return getAccountById(accountId);
}

/**
 * Update account information
 * 
 * @param accountId - Account ID
 * @param updates - Partial account object with fields to update
 * @returns Updated account object
 */
export function updateAccount(
  accountId: number,
  updates: Partial<Pick<Account, 'name' | 'current_balance' | 'type' | 'subtype' | 'institution'>>
): Account | undefined {
  const db = getDatabase();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  
  if (updates.current_balance !== undefined) {
    fields.push('current_balance = ?');
    values.push(updates.current_balance);
  }
  
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  
  if (updates.subtype !== undefined) {
    fields.push('subtype = ?');
    values.push(updates.subtype);
  }
  
  if (updates.institution !== undefined) {
    fields.push('institution = ?');
    values.push(updates.institution);
  }
  
  if (fields.length === 0) {
    return getAccountById(accountId);
  }
  
  values.push(accountId);
  
  const stmt = db.prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getAccountById(accountId);
}

/**
 * Delete account
 * 
 * @param accountId - Account ID
 * @returns True if account was deleted
 */
export function deleteAccount(accountId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM accounts WHERE id = ?');
  const result = stmt.run(accountId);
  
  return result.changes > 0;
}

/**
 * Get total balance across all accounts for a user
 * 
 * @param userId - User UUID
 * @returns Total balance sum
 */
export function getTotalBalanceByUserId(userId: string): number {
  const db = getDatabase();
  const stmt = db.prepare('SELECT SUM(current_balance) as total FROM accounts WHERE user_id = ?');
  const result = stmt.get(userId) as any;
  
  return result.total || 0;
}
