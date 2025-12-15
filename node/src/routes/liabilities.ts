import { Router } from 'express';
import { plaidClient } from '../config/plaid.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';

export const liabilitiesRouter = Router();
liabilitiesRouter.get('/liabilities', async (_req, res, next) => {
  try {
    const r = await plaidClient.liabilitiesGet({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(r.data);
    res.json({ error: null, liabilities: r.data });
  } catch (e) {
    next(e);
  }
});