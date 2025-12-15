import 'dotenv/config';

export type AppConfig = {
  APP_PORT: number;
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENV: 'sandbox' | 'development' | 'production';
  PLAID_PRODUCTS: string[];
  PLAID_COUNTRY_CODES: string[];
  PLAID_REDIRECT_URI?: string;
  PLAID_ANDROID_PACKAGE_NAME?: string;
  SIGNAL_RULESET_KEY?: string;
};

const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
};

export const config: AppConfig = {
  APP_PORT: Number(process.env.APP_PORT || 8000),
  // PLAID_CLIENT_ID: requireEnv('PLAID_CLIENT_ID'),
  PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID || '64f8f6f4d6f5a900018a8e7d', 
  // PLAID_SECRET: requireEnv('PLAID_SECRET'),
  PLAID_SECRET: process.env.PLAID_SECRET || 'f6f4d6f5a900018a8e7d64f8f',
  PLAID_ENV: (process.env.PLAID_ENV as AppConfig['PLAID_ENV']) || 'sandbox',
  PLAID_PRODUCTS: (process.env.PLAID_PRODUCTS || 'transactions').split(',').map(s => s.trim()),
  PLAID_COUNTRY_CODES: (process.env.PLAID_COUNTRY_CODES || 'US').split(',').map(s => s.trim()),
  PLAID_REDIRECT_URI: process.env.PLAID_REDIRECT_URI || '',
  PLAID_ANDROID_PACKAGE_NAME: process.env.PLAID_ANDROID_PACKAGE_NAME || '',
  SIGNAL_RULESET_KEY: process.env.SIGNAL_RULESET_KEY || ''
};