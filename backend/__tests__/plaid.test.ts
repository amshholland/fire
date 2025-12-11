import request from 'supertest';
import { app } from '../src/app';
import { PlaidService } from '../src/services/plaidService';

jest.mock('../src/services/plaidService');

describe('Plaid API Integration', () => {
  const plaidService = new PlaidService();

  beforeAll(() => {
    plaidService.createLinkToken = jest.fn().mockResolvedValue({ link_token: 'mock_link_token' });
    plaidService.getAccounts = jest.fn().mockResolvedValue([{ account_id: '1', name: 'Checking' }]);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should create a link token', async () => {
    const response = await request(app).post('/api/plaid/link_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('link_token', 'mock_link_token');
  });

  it('should retrieve account information', async () => {
    const response = await request(app).get('/api/plaid/accounts');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ account_id: '1', name: 'Checking' }]);
  });
});