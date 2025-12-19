import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';

export const statementsRouter = Router();

statementsRouter.get('/statements', async (_req, res, next) => {
  try {
    const list = await plaidClient.statementsList({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(list.data);
    const firstStmt = list.data.accounts[0]?.statements[0];
    if (!firstStmt) return res.status(404).json({ error: { message: 'No statements found' } });

    const pdf = await plaidClient.statementsDownload(
      { access_token: state.ACCESS_TOKEN!, statement_id: firstStmt.statement_id },
      { responseType: 'arraybuffer' }
    );
    prettyPrint(pdf.data);
    res.json({ json: list.data, pdf: Buffer.from(pdf.data).toString('base64') });
  } catch (e) {
    next(e);
  }
});