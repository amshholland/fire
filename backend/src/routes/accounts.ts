import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';

export const accountsRouter = Router();
accountsRouter.get('/accounts', async (req, res, next) => {
  try {
    const accessToken = req.query.access_token as string || state.ACCESS_TOKEN!;
    const r = await plaidClient.accountsGet({ access_token: accessToken });
    prettyPrint(r.data);
    res.json(r.data);
  } catch (e) {
    next(e);
  }
});