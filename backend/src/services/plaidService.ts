import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';

export class PlaidService {
    private client: PlaidApi;

    constructor() {
        const environment = (process.env.PLAID_ENV || 'sandbox') as keyof typeof PlaidEnvironments;
        const config = new Configuration({
            basePath: PlaidEnvironments[environment] || 'https://sandbox.plaid.com',
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
                    'PLAID-SECRET': process.env.PLAID_SECRET || '',
                },
            },
        });
        this.client = new PlaidApi(config);
    }

    async createLinkToken(userId: string) {
        const response = await this.client.linkTokenCreate({
            user: {
                client_user_id: userId,
            },
            client_name: 'Your App Name',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en',
        });
        return response.data;
    }

    async getAccounts(accessToken: string) {
        const response = await this.client.accountsGet({ access_token: accessToken });
        return response.data;
    }

    async getTransactions(accessToken: string, startDate: string, endDate: string) {
        const response = await this.client.transactionsGet({
            access_token: accessToken,
            start_date: startDate,
            end_date: endDate,
        });
        return response.data;
    }
}