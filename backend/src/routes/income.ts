import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';

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