# Backend - FIRE App

Express.js API server with Plaid integration for bank account data.

## Prerequisites

- Node.js 18+ installed
- Plaid account (sign up at <https://dashboard.plaid.com/signup>)

## Quick Start

**Recommended: Run from root directory**

```bash
cd ..
npm start
```

This starts both backend and frontend together.

## Standalone Installation

1. Navigate to the backend directory:

```bash
cd backend
```

1. Install dependencies:

```bash
npm install
```

1. Configure environment variables:

   - Copy `.env.example` to `.env`:
  
     ```bash
     cp .env.example .env
     ```

   - Update `.env` with your Plaid credentials:
     - Get your `PLAID_CLIENT_ID` and `PLAID_SECRET` from <https://dashboard.plaid.com/team/keys>
     - Set `PLAID_ENV` to `sandbox` for testing (free, uses test data)

## Development

**Run backend only:**

```bash
npm run dev
```

Server will start on <http://localhost:3001>

## Production

Build the TypeScript code:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## API Endpoints

All endpoints are prefixed with `/api/plaid`:

- `POST /api/plaid/create_link_token` - Create a link token for Plaid Link
- `POST /api/plaid/exchange_public_token` - Exchange public token for access token
- `GET /api/plaid/transactions?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get transactions
- `GET /api/plaid/accounts` - Get account balances
- `POST /api/plaid/item/remove` - Remove/disconnect a bank account

Health check: `GET /health`

## Testing with Plaid Sandbox

In sandbox mode, use these test credentials:

- Username: `user_good`
- Password: `pass_good`
- Any institution name (e.g., "Chase")

See more test credentials: <https://plaid.com/docs/sandbox/test-credentials/>

## Notes

- Access tokens are currently stored in-memory and will be lost on server restart
- For production, implement a database to persist tokens and associate them with users
- CORS is configured to allow requests from `http://localhost:3000` (frontend)
