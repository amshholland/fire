import { Router } from 'express';
import { state } from '../state/store';
import { config } from '../config/env';

export const infoRouter = Router();
infoRouter.post('/info', (_req, res) => {
  res.json({
    item_id: state.ITEM_ID,
    access_token: state.ACCESS_TOKEN,
    products: config.PLAID_PRODUCTS
  });
});