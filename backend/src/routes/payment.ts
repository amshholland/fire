import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient.js';
import { state } from '../state/store.js';
import { prettyPrint } from '../utils/logger.js';

export const paymentRouter = Router();
paymentRouter.get('/payment', async (_req, res, next) => {
  try {
    const payment = await plaidClient.paymentInitiationPaymentGet({ payment_id: state.PAYMENT_ID! });
    prettyPrint(payment.data);
    res.json({ error: null, payment: payment.data });
  } catch (e) {
    next(e);
  }
});