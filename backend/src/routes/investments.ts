import { Router } from 'express';
import moment from 'moment';
import { plaidClient } from '../config/plaid.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';

export const investmentsRouter = Router();
investmentsRouter.get('/investments_transactions', async (_req, res, next) => {
  try {
    const start_date = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const end_date = moment().format('YYYY-MM-DD');
    const r = await plaidClient.investmentsTransactionsGet({
      access_token: state.ACCESS_TOKEN!,
      start_date,
      end_date
    });
    prettyPrint(r.data);
    res.json({ error: null, investments_transactions: r.data });
  } catch (e) {
    next(e);
  }
});