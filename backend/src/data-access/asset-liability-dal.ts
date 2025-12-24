/**
 * Asset/Liability Data Access Layer
 * 
 * Handles all database operations for Asset/Liability entity.
 * Manages manually tracked assets (e.g., real estate, vehicles) 
 * and liabilities (e.g., mortgages, loans) not tracked via Plaid.
 */

import { getDatabase } from '../database/database';

export interface AssetLiability {
  id: number;
  user_id: string;
  name: string;
  type: 'asset' | 'liability';
  value: number;
  is_manual: boolean;
}

export interface CreateAssetLiabilityParams {
  user_id: string;
  name: string;
  type: 'asset' | 'liability';
  value: number;
}

/**
 * Create a new asset or liability
 * 
 * @param params - Asset/Liability creation parameters
 * @returns Created asset/liability object
 */
export function createAssetLiability(params: CreateAssetLiabilityParams): AssetLiability {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO assets_liabilities (user_id, name, type, value, is_manual)
    VALUES (?, ?, ?, ?, 1)
  `);
  
  const result = stmt.run(
    params.user_id,
    params.name,
    params.type,
    params.value
  );
  
  return getAssetLiabilityById(Number(result.lastInsertRowid))!;
}

/**
 * Get asset/liability by ID
 * 
 * @param id - Asset/Liability ID
 * @returns Asset/Liability object or undefined if not found
 */
export function getAssetLiabilityById(id: number): AssetLiability | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM assets_liabilities WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    value: row.value,
    is_manual: Boolean(row.is_manual)
  };
}

/**
 * Get all assets and liabilities for a user
 * 
 * @param userId - User UUID
 * @returns Array of user's assets and liabilities ordered by name
 */
export function getAssetLiabilitiesByUserId(userId: string): AssetLiability[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM assets_liabilities WHERE user_id = ? ORDER BY name');
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    value: row.value,
    is_manual: Boolean(row.is_manual)
  }));
}

/**
 * Get assets only for a user
 * 
 * @param userId - User UUID
 * @returns Array of user's assets
 */
export function getAssetsByUserId(userId: string): AssetLiability[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM assets_liabilities 
    WHERE user_id = ? AND type = 'asset'
    ORDER BY name
  `);
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    value: row.value,
    is_manual: Boolean(row.is_manual)
  }));
}

/**
 * Get liabilities only for a user
 * 
 * @param userId - User UUID
 * @returns Array of user's liabilities
 */
export function getLiabilitiesByUserId(userId: string): AssetLiability[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM assets_liabilities 
    WHERE user_id = ? AND type = 'liability'
    ORDER BY name
  `);
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    value: row.value,
    is_manual: Boolean(row.is_manual)
  }));
}

/**
 * Update asset/liability
 * 
 * @param id - Asset/Liability ID
 * @param updates - Partial object with fields to update
 * @returns Updated asset/liability object
 */
export function updateAssetLiability(
  id: number,
  updates: Partial<Pick<AssetLiability, 'name' | 'value' | 'type'>>
): AssetLiability | undefined {
  const db = getDatabase();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  
  if (updates.value !== undefined) {
    fields.push('value = ?');
    values.push(updates.value);
  }
  
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  
  if (fields.length === 0) {
    return getAssetLiabilityById(id);
  }
  
  values.push(id);
  
  const stmt = db.prepare(`UPDATE assets_liabilities SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getAssetLiabilityById(id);
}

/**
 * Delete asset/liability
 * 
 * @param id - Asset/Liability ID
 * @returns True if deleted successfully
 */
export function deleteAssetLiability(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM assets_liabilities WHERE id = ?');
  const result = stmt.run(id);
  
  return result.changes > 0;
}

/**
 * Get total value of all assets for a user
 * 
 * @param userId - User UUID
 * @returns Sum of all asset values
 */
export function getTotalAssetValue(userId: string): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT SUM(value) as total FROM assets_liabilities 
    WHERE user_id = ? AND type = 'asset'
  `);
  const result = stmt.get(userId) as any;
  
  return result.total || 0;
}

/**
 * Get total value of all liabilities for a user
 * 
 * @param userId - User UUID
 * @returns Sum of all liability values
 */
export function getTotalLiabilityValue(userId: string): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT SUM(value) as total FROM assets_liabilities 
    WHERE user_id = ? AND type = 'liability'
  `);
  const result = stmt.get(userId) as any;
  
  return result.total || 0;
}

/**
 * Calculate net worth for a user (assets - liabilities)
 * Includes manual assets/liabilities from this table
 * Should be combined with account balances for complete net worth
 * 
 * @param userId - User UUID
 * @returns Net worth from manual assets and liabilities
 */
export function getNetWorthFromManualItems(userId: string): number {
  const totalAssets = getTotalAssetValue(userId);
  const totalLiabilities = getTotalLiabilityValue(userId);
  
  return totalAssets - totalLiabilities;
}
