import React from 'react';
import { PlaidLink } from 'react-plaid-link';
import axios from 'axios';

const PlaidLinkAuth = () => {
  const onSuccess = async (public_token) => {
    try {
      // Exchange public token for access token
      const response = await axios.post('http://localhost:5000/api/exchange_public_token', {
        public_token,
      });

      const { access_token } = response.data;

      // Fetch transactions
      const transactionsResponse = await axios.post('http://localhost:5000/api/transactions', {
        access_token,
      });

      console.log('Transactions:', transactionsResponse.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <PlaidLink
      token="<GENERATED_LINK_TOKEN>"
      onSuccess={onSuccess}
      onExit={() => console.log('User exited Plaid Link')}
    >
      Connect a Bank Account
    </PlaidLink>
  );
};

export default PlaidLinkAuth;