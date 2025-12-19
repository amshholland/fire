const API_BASE = process.env.REACT_APP_API_URL || '';

export const plaidApi = {
  async createLinkToken(): Promise<string> {
    const response = await fetch(`${API_BASE}/api/plaid/link_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create link token');
    }
    
    const data = await response.json();
    console.log('link token data:', data);
    return data.link_token;
  },

  async exchangePublicToken(publicToken: string): Promise<{ access_token: string; item_id: string }> {
    const response = await fetch(`${API_BASE}/api/plaid/exchange_public_token`, {
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
  },

  async getAccounts(accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/plaid/accounts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch accounts');
    }
    
    return response.json();
  },
};