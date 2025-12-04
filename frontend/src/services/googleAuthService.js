import axios from 'axios';

export const verifyGoogleToken = async (tokenId) => {
  try {
    const response = await axios.post('http://localhost:5000/auth/google', { token: tokenId });
    return response.data;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
};