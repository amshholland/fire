import express from 'express';
import cors from 'cors';
import { config as appConfig } from './config/env';
import { apiErrorMiddleware } from './utils/errors';
import { initializeDatabase, seedDatabase } from './db/database';

import { infoRouter } from './routes/info';
import { linkRouter } from './routes/link';
import { tokenRouter } from './routes/token';
import { authRouter } from './routes/auth';
import { transactionsRouter } from './routes/transactions';
import { investmentsRouter } from './routes/investments';
import { identityRouter } from './routes/identity';
import { balanceRouter } from './routes/balance';
import { holdingsRouter } from './routes/holdings';
import { liabilitiesRouter } from './routes/liabilities';
import { accountsRouter } from './routes/accounts';
import { assetsRouter } from './routes/assets';
import { statementsRouter } from './routes/statements';
import { paymentRouter } from './routes/payment';
import { incomeRouter } from './routes/income';
import { signalRouter } from './routes/signal';
import { budgetsRouter } from './routes/budgets';
import { categoriesRouter } from './routes/categories';
import { debugRouter } from './routes/debug';

const app = express();

// Initialize database and seed with sample data
initializeDatabase();
if (process.env.NODE_ENV !== 'production') {
  seedDatabase();
}

// Enable CORS for frontend on port 3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/api', infoRouter);
app.use('/api', linkRouter);
app.use('/api', tokenRouter);
app.use('/api', authRouter);
app.use('/api', transactionsRouter);
app.use('/api', investmentsRouter);
app.use('/api', identityRouter);
app.use('/api', balanceRouter);
app.use('/api', holdingsRouter);
app.use('/api', liabilitiesRouter);
app.use('/api', accountsRouter);
app.use('/api', assetsRouter);
app.use('/api', statementsRouter);
app.use('/api', paymentRouter);
app.use('/api', incomeRouter);
app.use('/api', signalRouter);
app.use('/api', budgetsRouter);
app.use('/api', categoriesRouter);

// Debug routes (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api', debugRouter);
}

app.use('/api', apiErrorMiddleware);

app.listen(appConfig.APP_PORT, () => {
  console.log(`plaid-quickstart server listening on port ${appConfig.APP_PORT}`);
  console.log(appConfig.PLAID_CLIENT_ID || 'no client id found');
});