/**
 * Plaid API Models
 * 
 * Type definitions for Plaid API requests and responses
 */

export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface PlaidPublicTokenExchangeRequest {
  public_token: string;
}

export interface PlaidPublicTokenExchangeResponse {
  access_token: string;
  item_id: string;
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category?: string[];
  pending: boolean;
}

export interface PlaidTransactionsResponse {
  transactions: PlaidTransaction[];
  accounts: any[];
  total_transactions: number;
}
