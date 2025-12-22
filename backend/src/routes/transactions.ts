import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { sleep } from '../utils/time';
import { prettyPrint } from '../utils/logger';

export const transactionsRouter = Router();

transactionsRouter.get('/transactions', async (req, res, next) => {
  try {
    const accessToken = req.query.access_token as string
    
    if (!accessToken) {
      return res.status(400).json({ error: 'access_token is required' })
    }

    let cursor: string | null = null;
    let added: any[] = [];
    let modified: any[] = [];
    let removed: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({ access_token: accessToken });

      console.log('Fetched transactions page:', accessToken);
      const data = response.data;
      cursor = data.next_cursor;
      if (cursor === '') {
        await sleep(2000);
        continue;
      }
      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;
      prettyPrint(response.data);
    }

    const compareAsc = (a: any, b: any) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0);
    const recently_added = [...added].sort(compareAsc).slice(-8);
    res.json({ latest_transactions: recently_added });
  } catch (e) {
    next(e);
  }
});