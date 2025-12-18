import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import linkTokenRoutes from './src/routes/linkTokenRoutes';

const app = express();

// Enable CORS for frontend on port 3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/api', linkTokenRoutes);

// Error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

