import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';

export const balanceRouter = Router();
balanceRouter.get('/balance', async (_req, res, next) => {
  try {
    const r = await plaidClient.accountsBalanceGet({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(r.data);
    res.json({ accounts: r.data.accounts });
  } catch (e) {
    next(e);
  }
});