import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { APP_PORT, PLAID_CLIENT_ID, PLAID_SECRET } from './src/config';
import linkTokenRoutes from './src/routes/linkTokenRoutes';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api', linkTokenRoutes);

const server = app.listen(APP_PORT, () => {
  console.log(`plaid-quickstart server listening on port ${APP_PORT}`);
  console.log('plaid-quickstart server listening on port ' + PLAID_CLIENT_ID);
  console.log(PLAID_SECRET || 'no client id found')
});