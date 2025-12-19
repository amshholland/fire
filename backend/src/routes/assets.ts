import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';
import { pollWithRetries } from '../utils/poll';

export const assetsRouter = Router();

assetsRouter.get('/assets', async (_req, res, next) => {
  try {
    const daysRequested = 10;
    const options = {
      client_report_id: 'Custom Report ID #123',
      user: {
        client_user_id: 'Custom User ID #456',
        first_name: 'Alice',
        middle_name: 'Bobcat',
        last_name: 'Cranberry',
        ssn: '123-45-6789',
        phone_number: '555-123-4567',
        email: 'alice@example.com'
      }
    };
    const createResp = await plaidClient.assetReportCreate({
      access_tokens: [state.ACCESS_TOKEN!],
      days_requested: daysRequested,
      options
    });
    prettyPrint(createResp.data);
    const token = createResp.data.asset_report_token;

    const getResponse = await pollWithRetries(() => plaidClient.assetReportGet({ asset_report_token: token }));
    const pdfResp = await plaidClient.assetReportPdfGet({ asset_report_token: token }, { responseType: 'arraybuffer' });
    prettyPrint(getResponse.data);
    prettyPrint(pdfResp.data);

    res.json({ json: (getResponse as any).data.report, pdf: Buffer.from(pdfResp.data).toString('base64') });
  } catch (e) {
    next(e);
  }
});