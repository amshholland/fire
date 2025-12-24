import { useCallback } from 'react';
import { STORAGE_KEYS } from '../config/storageConfig.ts';

/**
 * Hook to sync Plaid account and transaction data to our database
 */
export const usePlaidSync = () => {
  const syncPlaidData = useCallback(async () => {
    try {
      // Get stored user and credentials
      const storedUser = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER);
      const accessToken = localStorage.getItem(STORAGE_KEYS.PLAID_ACCESS_TOKEN);

      if (!storedUser) {
        console.error('No user data found');
        return false;
      }

      let userId: string;
      try {
        const user = JSON.parse(storedUser);
        userId = user.userId;
      } catch (error) {
        console.error('Failed to parse user data:', error);
        return false;
      }

      if (!userId || !accessToken) {
        console.error('Missing userId or accessToken for Plaid sync');
        return false;
      }

      // Fetch accounts from Plaid API using query parameter
      console.log('Fetching Plaid accounts...');
      const accountsResponse = await fetch(`/api/accounts?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!accountsResponse.ok) {
        throw new Error(`Failed to fetch accounts: ${accountsResponse.statusText}`);
      }

      const accountsData = await accountsResponse.json();
      console.log('Plaid accounts:', accountsData);

      // Save accounts to our database
      console.log('Saving accounts to database...');
      const saveAccountsResponse = await fetch(`/api/user/${userId}/plaid/sync-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accounts: accountsData.accounts || [],
          institution: accountsData.accounts?.[0]?.institution || null,
        }),
      });

      if (!saveAccountsResponse.ok) {
        throw new Error(`Failed to save accounts: ${saveAccountsResponse.statusText}`);
      }

      const savedAccounts = await saveAccountsResponse.json();
      console.log('Accounts saved:', savedAccounts);

      // Get account mapping (Plaid ID -> Our DB ID)
      const accountMapping: Record<string, number> = {};
      savedAccounts.accounts?.forEach((account: any) => {
        // Use account_id as the key since that's what we filter by in transactions
        accountMapping[account.plaid_account_id] = account.id;
      });

      // Fetch transactions for each account and save them
      console.log('Fetching all Plaid transactions...');
      
      // Get all transactions in one call instead of per-account
      const allTxResponse = await fetch(`/api/plaid/all-transactions?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!allTxResponse.ok) {
        console.warn(`Failed to fetch all transactions`);
      } else {
        const allTransactionsData = await allTxResponse.json();
        const allTransactions = allTransactionsData.transactions || [];
        console.log(`[PLAID-SYNC] Received ${allTransactions.length} total transactions from Plaid`);

        // Group transactions by account and save them
        for (const plaidAccount of accountsData.accounts || []) {
          const plaidAccountId = plaidAccount.account_id || plaidAccount.id;
          const dbAccountId = accountMapping[plaidAccountId];
          
          if (!dbAccountId) {
            console.warn(`No DB account ID found for Plaid account ${plaidAccountId}`);
            continue;
          }

          // Filter transactions for this specific account
          const accountTransactions = allTransactions.filter(
            (tx: any) => tx.account_id === plaidAccountId
          );

          console.log(`Found ${accountTransactions.length} transactions for account ${plaidAccountId}...`);
          
          if (accountTransactions.length > 0) {
            const saveTxResponse = await fetch(`/api/user/${userId}/plaid/sync-transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountId: dbAccountId,
                transactions: accountTransactions,
              }),
            });

            if (!saveTxResponse.ok) {
              const error = await saveTxResponse.json();
              console.error(`Failed to save transactions for account ${plaidAccountId}:`, error);
              continue;
            }

            const savedTx = await saveTxResponse.json();
            console.log(`Saved ${savedTx.transactions?.length || 0} transactions for account ${plaidAccountId}`);
          }
        }
      }

      console.log('Plaid data sync completed successfully');
      return true;
    } catch (error) {
      console.error('Error syncing Plaid data:', error);
      return false;
    }
  }, []);

  return { syncPlaidData };
};
