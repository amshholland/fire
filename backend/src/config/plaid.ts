import { Configuration, PlaidApi } from 'plaid';

const configuration = new Configuration({
  basePath: 'https://sandbox.plaid.com', // Change to the appropriate environment
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
      'Content-Type': 'application/json',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export { plaidClient };