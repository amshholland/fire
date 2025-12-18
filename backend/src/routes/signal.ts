import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';
import { config } from '../config/env.js';

export const signalRouter = Router();

signalRouter.get('/signal_evaluate', async (_req, res, next) => {
  try {
    if (!state.ACCESS_TOKEN) {
      return res.status(401).json({ error: 'No access token. Please link your account first.' });
    }
    const accounts = await plaidClient.accountsGet({ access_token: state.ACCESS_TOKEN });
    state.ACCOUNT_ID = accounts.data.accounts[0].account_id;

    const client_transaction_id = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const request: any = {
      access_token: state.ACCESS_TOKEN,
      account_id: state.ACCOUNT_ID!,
      client_transaction_id,
      amount: 100.0
    };
    if (config.SIGNAL_RULESET_KEY) request.ruleset_key = config.SIGNAL_RULESET_KEY;

    const r = await plaidClient.signalEvaluate(request);
    prettyPrint(r.data);
    res.json(r.data);
  } catch (e) {
    next(e);
  }
});