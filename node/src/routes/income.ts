import { Router } from 'express';
import { plaidClient } from '../config/plaid.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';

export const incomeRouter = Router();
incomeRouter.get('/income/verification/paystubs', async (_req, res, next) => {
  try {
    const r = await plaidClient.incomeVerificationPaystubsGet({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(r.data);
    res.json({ error: null, paystubs: r.data });
  } catch (e) {
    next(e);
  }
});