import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';

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