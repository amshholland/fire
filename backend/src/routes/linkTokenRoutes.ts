import express, { Request, Response, NextFunction } from 'express';
import moment from 'moment';
import { plaidClient } from '../clients/plaidClient';
import { config } from '../config/env';
import { Products, CountryCode, LinkTokenCreateRequest, LinkTokenCreateResponse } from 'plaid'; 
import { apiErrorFormatter } from '../utils/errors';

const router = express.Router();

router.post('/info', (_req: Request, res: Response) => {
  res.json({
    item_id: null,
    access_token: null,
    products: config.PLAID_PRODUCTS,
  });
});

router.post('/create_link_token', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const configs: LinkTokenCreateRequest = {
      user: {
        client_user_id: 'user-id',
      },
      client_name: 'Plaid Quickstart',
      products: config.PLAID_PRODUCTS as Products[],
      country_codes: config.PLAID_COUNTRY_CODES as CountryCode[],
      language: 'en',
    };

    if (config.PLAID_REDIRECT_URI) {
      configs.redirect_uri = config.PLAID_REDIRECT_URI;
    }

    if (config.PLAID_ANDROID_PACKAGE_NAME) {
      configs.android_package_name = config.PLAID_ANDROID_PACKAGE_NAME;
    }

    if (config.PLAID_PRODUCTS.includes(Products.Statements)) {
      configs.statements = {
        end_date: moment().format('YYYY-MM-DD'),
        start_date: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      };
    }

    const createTokenResponse: LinkTokenCreateResponse = (await plaidClient.linkTokenCreate(configs)).data;
    res.json(createTokenResponse);
  } catch (error) {
    next(apiErrorFormatter(error));
  }
});

// Alias for payment_initiation variant
router.post('/create_link_token_for_payment', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const configs: LinkTokenCreateRequest = {
      user: {
        client_user_id: 'user-id',
      },
      client_name: 'Plaid Quickstart',
      products: [Products.PaymentInitiation],
      country_codes: config.PLAID_COUNTRY_CODES as CountryCode[],
      language: 'en',
    };

    if (config.PLAID_REDIRECT_URI) {
      configs.redirect_uri = config.PLAID_REDIRECT_URI;
    }

    const createTokenResponse: LinkTokenCreateResponse = (await plaidClient.linkTokenCreate(configs)).data;
    res.json(createTokenResponse);
  } catch (error) {
    next(apiErrorFormatter(error));
  }
});

router.post('/create_user_token', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented - user token creation requires Plaid configuration' });
});

router.post('/set_access_token', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented - access token must be exchanged from public token via Plaid API' });
});

export default router;