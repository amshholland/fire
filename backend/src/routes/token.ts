import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';

export const tokenRouter = Router();
tokenRouter.post('/set_access_token', async (req, res, next) => {
  try {
    state.PUBLIC_TOKEN = req.body.public_token;
    const tokenResp = await plaidClient.itemPublicTokenExchange({ public_token: state.PUBLIC_TOKEN! });
    prettyPrint(tokenResp.data);
    state.ACCESS_TOKEN = tokenResp.data.access_token;
    state.ITEM_ID = tokenResp.data.item_id;
    res.json({ access_token: state.ACCESS_TOKEN, item_id: state.ITEM_ID, error: null });
  } catch (e) {
    next(e);
  }
});