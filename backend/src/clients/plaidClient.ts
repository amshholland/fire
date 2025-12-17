import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { config } from '../config/env'

/**
 * Plaid API client instance
 * Configured with credentials and environment from config/env
 */
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[config.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': config.PLAID_CLIENT_ID,
      'PLAID-SECRET': config.PLAID_SECRET,
      'Plaid-Version': '2020-09-14'
    }
  }
})

export const plaidClient = new PlaidApi(plaidConfig)
