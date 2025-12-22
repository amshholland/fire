import { Router } from 'express';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { plaidClient } from '../clients/plaidClient';
import { config } from '../config/env';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';

export const linkRouter = Router();

linkRouter.post('/create_link_token', async (_req, res, next) => {
  try {
    const products = config.PLAID_PRODUCTS;
    const configs: any = {
      user: { client_user_id: 'user-id' },
      client_name: 'Plaid Quickstart',
      products,
      country_codes: config.PLAID_COUNTRY_CODES,
      language: 'en'
    };

    if (config.PLAID_REDIRECT_URI) configs.redirect_uri = config.PLAID_REDIRECT_URI;
    if (config.PLAID_ANDROID_PACKAGE_NAME) configs.android_package_name = config.PLAID_ANDROID_PACKAGE_NAME;

    if (products.includes('statements')) {
      configs.statements = {
        end_date: moment().format('YYYY-MM-DD'),
        start_date: moment().subtract(30, 'days').format('YYYY-MM-DD')
      };
    }

    if (products.some((p) => p.startsWith('cra_'))) {
      configs.user_token = state.USER_TOKEN;
      configs.cra_options = { days_requested: 60 };
      configs.consumer_report_permissible_purpose = 'ACCOUNT_REVIEW_CREDIT';
    }

    const resp = await plaidClient.linkTokenCreate(configs);
    prettyPrint(resp.data);
    res.json(resp.data);
  } catch (e) {
    next(e);
  }
});

linkRouter.post('/create_user_token', async (_req, res, next) => {
  try {
    const request: any = { client_user_id: 'user_' + uuidv4() };
    if (config.PLAID_PRODUCTS.some((p) => p.startsWith('cra_'))) {
      request.consumer_report_user_identity = {
        date_of_birth: '1980-07-31',
        first_name: 'Harry',
        last_name: 'Potter',
        phone_numbers: ['+16174567890'],
        emails: ['harrypotter@example.com'],
        primary_address: {
          city: 'New York',
          region: 'NY',
          street: '4 Privet Drive',
          postal_code: '11111',
          country: 'US'
        }
      };
    }
    const user = await plaidClient.userCreate(request);
    state.USER_TOKEN = user.data.user_token;
    res.json(user.data);
  } catch (e) {
    next(e);
  }
});
