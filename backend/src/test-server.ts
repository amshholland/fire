import express from 'express';
import cors from 'cors';
import { config as appConfig } from './config/env';
import { apiErrorMiddleware } from './utils/errors';
import { initializeDatabase, seedDatabase } from './db/database';
import { budgetsRouter } from './routes/budgets';

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

// Only register the budgets router to test
app.use('/api', budgetsRouter);

app.use('/api', apiErrorMiddleware);

app.listen(appConfig.APP_PORT, () => {
  console.log(`FIRE backend server listening on port ${appConfig.APP_PORT}`);
});
