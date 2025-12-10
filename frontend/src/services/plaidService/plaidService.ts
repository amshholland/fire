import type {
  PlaidLinkTokenResponse,
  PlaidPublicTokenExchangeResponse,
  PlaidTransactionsResponse,
} from './plaidService.models.ts';

const API_BASE_URL = '/api/plaid';

/**
 * Creates a link token for initializing Plaid Link
 * @returns Promise containing the link token and expiration
 */
export async function createLinkToken(): Promise<PlaidLinkTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/create_link_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create link token');
  }

  return response.json();
}

/**
 * Exchanges a public token for an access token
 * @param publicToken - The public token received from Plaid Link
 * @returns Promise containing the access token and item ID
 */
export async function exchangePublicToken(
  publicToken: string
): Promise<PlaidPublicTokenExchangeResponse> {
  const response = await fetch(`${API_BASE_URL}/exchange_public_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ public_token: publicToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to exchange public token');
  }

  return response.json();
}

/**
 * Fetches transactions for a given date range
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param accessToken - Optional access token (if not stored server-side)
 * @returns Promise containing transactions and account data
 */
export async function getTransactions(
  startDate: string,
  endDate: string,
  accessToken?: string
): Promise<PlaidTransactionsResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  if (accessToken) {
    params.append('access_token', accessToken);
  }

  const response = await fetch(`${API_BASE_URL}/transactions?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transactions');
  }

  return response.json();
}

/**
 * Fetches account balances
 * @param accessToken - Optional access token (if not stored server-side)
 * @returns Promise containing account balance data
 */
export async function getAccounts(accessToken?: string): Promise<any> {
  const params = new URLSearchParams();
  
  if (accessToken) {
    params.append('access_token', accessToken);
  }

  const response = await fetch(`${API_BASE_URL}/accounts?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch accounts');
  }

  return response.json();
}

/**
 * Removes a Plaid item (disconnects a bank account)
 * @param accessToken - The access token for the item to remove
 * @returns Promise indicating success
 */
export async function removeItem(accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/item/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove item');
  }
}
