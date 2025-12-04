import axios from 'axios';

export const exchangePublicToken = async (public_token) => {
  try {
    const response = await axios.post('http://localhost:5000/api/exchange_public_token', {
      public_token,
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
};

export const fetchTransactions = async (access_token) => {
  try {
    const response = await axios.post('http://localhost:5000/api/transactions', {
      access_token,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};