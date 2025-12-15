import dotenv from 'dotenv';
import { Products } from 'plaid';

dotenv.config();

export const APP_PORT: number = parseInt(process.env.APP_PORT || '3000', 10);
export const PLAID_CLIENT_ID: string = process.env.PLAID_CLIENT_ID || '';
export const PLAID_SECRET: string = process.env.PLAID_SECRET || '';
export const PLAID_ENV: string = process.env.PLAID_ENV || 'sandbox';
export const PLAID_PRODUCTS: Products[] = (process.env.PLAID_PRODUCTS || Products.Transactions).split(',') as Products[];
export const PLAID_COUNTRY_CODES: string[] = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');
export const PLAID_REDIRECT_URI: string = process.env.PLAID_REDIRECT_URI || '';
export const PLAID_ANDROID_PACKAGE_NAME: string = process.env.PLAID_ANDROID_PACKAGE_NAME || '';