import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';

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