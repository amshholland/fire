/**
 * Plaid Client Configuration
 * 
 * Initializes and exports the Plaid client with environment-specific configuration
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['PLAID_CLIENT_ID', 'PLAID_SECRET', 'PLAID_ENV'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Map environment string to Plaid environment
const getPlaidEnvironment = (env: string) => {
  switch (env) {
    case 'sandbox':
      return PlaidEnvironments.sandbox;
    case 'development':
      return PlaidEnvironments.development;
    case 'production':
      return PlaidEnvironments.production;
    default:
      throw new Error(`Invalid PLAID_ENV: ${env}`);
  }
};

// Create Plaid configuration
const configuration = new Configuration({
  basePath: getPlaidEnvironment(process.env.PLAID_ENV!),
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

// Export configured Plaid client
export const plaidClient = new PlaidApi(configuration);

// Export environment for reference
export const plaidEnv = process.env.PLAID_ENV;
