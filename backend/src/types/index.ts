export interface PlaidLinkTokenResponse {
    link_token: string;
}

export interface PlaidAccountsResponse {
    accounts: Array<{
        account_id: string;
        name: string;
        mask: string;
        type: string;
        subtype: string;
        institution: {
            name: string;
            institution_id: string;
        };
    }>;
}

export interface PlaidTransactionsResponse {
    transactions: Array<{
        transaction_id: string;
        amount: number;
        date: string;
        name: string;
        category: Array<string>;
    }>;
}

export interface CreateLinkTokenRequest {
    user_id: string;
}

export interface FetchTransactionsRequest {
    access_token: string;
    start_date: string;
    end_date: string;
}