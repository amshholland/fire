import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';

export const holdingsRouter = Router();
holdingsRouter.get('/holdings', async (_req, res, next) => {
  try {
    const r = await plaidClient.investmentsHoldingsGet({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(r.data);
    res.json({ error: null, holdings: r.data });
  } catch (e) {
    next(e);
  }
});