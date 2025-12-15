import { Router } from 'express';
import { plaidClient } from '../config/plaid.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';

export const identityRouter = Router();
identityRouter.get('/identity', async (_req, res, next) => {
  try {
    const r = await plaidClient.identityGet({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(r.data);
    res.json({ identity: r.data.accounts });
  } catch (e) {
    next(e);
  }
});