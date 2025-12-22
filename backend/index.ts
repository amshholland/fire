import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { APP_PORT, PLAID_CLIENT_ID, PLAID_SECRET } from './src/config';

const app = express();

// Enable CORS for frontend on port 3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const server = app.listen(APP_PORT, () => {
  console.log(`plaid-quickstart server listening on port ${APP_PORT}`);
  console.log('plaid-quickstart server listening on port ' + PLAID_CLIENT_ID);
  console.log(PLAID_SECRET || 'no client id found')
});