import { Router } from 'express';
import { plaidClient } from '../config/plaid.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';

export const accountsRouter = Router();
accountsRouter.get('/accounts', async (_req, res, next) => {
  try {
    const r = await plaidClient.accountsGet({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(r.data);
    res.json(r.data);
  } catch (e) {
    next(e);
  }
});