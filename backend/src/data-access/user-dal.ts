/**
 * User Data Access Layer
 * 
 * Handles all database operations for User entity.
 * Follows single responsibility principle - only data access, no business logic.
 */

import { getDatabase } from '../database/database';

export interface User {
  id: string;
  email: string;
  google_id: string | null;
  auth_provider: string;
  created_at: string;
  has_linked_plaid: boolean;
  onboarding_completed: boolean;
}

/**
 * Create a new user
 * 
 * @param id - UUID for the user
 * @param email - User's email address
 * @param googleId - Optional Google user ID
 * @param authProvider - Authentication provider (defaults to 'local')
 * @returns Created user object
 */
export function createUser(
  id: string,
  email: string,
  googleId?: string | null,
  authProvider: string = 'local'
): User {
  const db = getDatabase();
  const stmt = db.prepare(
    'INSERT INTO users (id, email, google_id, auth_provider, has_linked_plaid, onboarding_completed) VALUES (?, ?, ?, ?, 0, 0)'
  );
  
  stmt.run(id, email, googleId || null, authProvider);
  
  return getUserById(id)!;
}

/**
 * Get user by ID
 * 
 * @param id - User UUID
 * @returns User object or undefined if not found
 */
export function getUserById(id: string): User | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    email: row.email,
    google_id: row.google_id,
    auth_provider: row.auth_provider,
    created_at: row.created_at,
    has_linked_plaid: Boolean(row.has_linked_plaid),
    onboarding_completed: Boolean(row.onboarding_completed)
  };
}

/**
 * Get user by email
 * 
 * @param email - User's email address
 * @returns User object or undefined if not found
 */
export function getUserByEmail(email: string): User | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const row = stmt.get(email) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    email: row.email,
    google_id: row.google_id,
    auth_provider: row.auth_provider,
    created_at: row.created_at,
    has_linked_plaid: Boolean(row.has_linked_plaid),
    onboarding_completed: Boolean(row.onboarding_completed)
  };
}

/**
 * Get user by Google ID
 * Used for Google OAuth authentication
 * 
 * @param googleId - Google's unique user identifier
 * @returns User object or undefined if not found
 */
export function getUserByGoogleId(googleId: string): User | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE google_id = ?');
  const row = stmt.get(googleId) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    email: row.email,
    google_id: row.google_id,
    auth_provider: row.auth_provider,
    created_at: row.created_at,
    has_linked_plaid: Boolean(row.has_linked_plaid),
    onboarding_completed: Boolean(row.onboarding_completed)
  };
}

/**
 * Update user's Plaid linkage status
 * 
 * @param userId - User UUID
 * @param hasLinked - Whether user has linked Plaid account
 * @returns Updated user object
 */
export function updateUserPlaidStatus(userId: string, hasLinked: boolean): User | undefined {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE users SET has_linked_plaid = ? WHERE id = ?');
  
  stmt.run(hasLinked ? 1 : 0, userId);
  
  return getUserById(userId);
}

/**
 * Update user's onboarding completion status
 * 
 * @param userId - User UUID
 * @param completed - Whether user has completed onboarding
 * @returns Updated user object
 */
export function updateUserOnboardingStatus(userId: string, completed: boolean): User | undefined {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE users SET onboarding_completed = ? WHERE id = ?');
  
  stmt.run(completed ? 1 : 0, userId);
  
  return getUserById(userId);
}

/**
 * Update user information
 * 
 * @param userId - User UUID
 * @param updates - Partial user object with fields to update
 * @returns Updated user object
 */
export function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'has_linked_plaid' | 'onboarding_completed'>>
): User | undefined {
  const db = getDatabase();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.has_linked_plaid !== undefined) {
    fields.push('has_linked_plaid = ?');
    values.push(updates.has_linked_plaid ? 1 : 0);
  }
  
  if (updates.onboarding_completed !== undefined) {
    fields.push('onboarding_completed = ?');
    values.push(updates.onboarding_completed ? 1 : 0);
  }
  
  if (fields.length === 0) {
    return getUserById(userId);
  }
  
  values.push(userId);
  
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getUserById(userId);
}

/**
 * Delete user (cascades to related data)
 * 
 * @param userId - User UUID
 * @returns True if user was deleted
 */
export function deleteUser(userId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(userId);
  
  return result.changes > 0;
}

/**
 * Get all users (primarily for admin/testing)
 * 
 * @returns Array of all users
 */
export function getAllUsers(): User[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
  const rows = stmt.all() as any[];
  
  return rows.map(row => ({
    id: row.id,
    email: row.email,
    google_id: row.google_id,
    auth_provider: row.auth_provider,
    created_at: row.created_at,
    has_linked_plaid: Boolean(row.has_linked_plaid),
    onboarding_completed: Boolean(row.onboarding_completed)
  }));
}
