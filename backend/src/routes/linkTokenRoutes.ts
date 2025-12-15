import express, { Request, Response, NextFunction } from 'express';
import moment from 'moment';
import { plaidClient } from '../services/plaidService';
import { PLAID_PRODUCTS, PLAID_COUNTRY_CODES, PLAID_REDIRECT_URI, PLAID_ANDROID_PACKAGE_NAME } from '../config';
import { Products, CountryCode, LinkTokenCreateRequest, LinkTokenCreateResponse } from 'plaid'; 
import { apiErrorFormatter } from '../utils/errors';

const router = express.Router();

router.post('/info', (req: Request, res: Response) => {
  res.json({
    item_id: null,
    access_token: null,
    products: PLAID_PRODUCTS,
  });
});

router.post('/create_link_token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs: LinkTokenCreateRequest = {
      user: {
        client_user_id: 'user-id',
      },
      client_name: 'Plaid Quickstart',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES as CountryCode[],
      language: 'en',
    };

    if (PLAID_REDIRECT_URI) {
      configs.redirect_uri = PLAID_REDIRECT_URI;
    }

    if (PLAID_ANDROID_PACKAGE_NAME) {
      configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME;
    }

    if (PLAID_PRODUCTS.includes(Products.Statements)) {
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

export default router;