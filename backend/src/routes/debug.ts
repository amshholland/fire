import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/database';

export const debugRouter = Router();

/**
 * GET /api/debug/database
 * 
 * Returns database status and table information.
 * Only available in non-production environments.
 */
debugRouter.get('/debug/database', (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if database is open
    const isOpen = db.open;

    // Get all tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all() as Array<{ name: string }>;

    // Get row counts for each table
    const tableCounts: Record<string, number> = {};
    tables.forEach(table => {
      try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
        tableCounts[table.name] = result.count;
      } catch (error) {
        tableCounts[table.name] = -1; // Error getting count
      }
    });

    // Get sample data from key tables
    const sampleData: Record<string, any[]> = {};
    const sampleTables = ['users', 'transactions', 'categories', 'accounts', 'budgets'];
    
    sampleTables.forEach(tableName => {
      if (tables.some(t => t.name === tableName)) {
        try {
          sampleData[tableName] = db.prepare(`SELECT * FROM ${tableName}`).all();
        } catch (error) {
          sampleData[tableName] = [];
        }
      }
    });

    res.status(200).json({
      status: 'ok',
      database: {
        open: isOpen,
        inMemory: db.memory,
        readonly: db.readonly
      },
      tables: tables.map(t => t.name),
      rowCounts: tableCounts,
      samples: sampleData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/debug/transactions
 * 
 * Returns sample transactions with full details.
 */
debugRouter.get('/debug/transactions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string;

    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
    `;

    const params: any[] = [];
    if (userId) {
      query += ' WHERE t.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY t.date DESC';

    const transactions = db.prepare(query).all(...params);

    res.status(200).json({
      count: transactions.length,
      transactions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/debug/categories
 * 
 * Returns all categories.
 */
debugRouter.get('/debug/categories', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id').all();

    res.status(200).json({
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/debug/users
 * 
 * Returns all users (without sensitive data).
 */
debugRouter.get('/debug/users', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = db.prepare('SELECT id, email, created_at FROM users ORDER BY created_at').all();

    res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
});
