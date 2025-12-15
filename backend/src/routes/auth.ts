import { Router } from 'express';
import { plaidClient } from '../config/plaid.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';

export const authRouter = Router();
authRouter.get('/auth', async (_req, res, next) => {
  try {
    const r = await plaidClient.authGet({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(r.data);
    res.json(r.data);
  } catch (e) {
    next(e);
  }
});