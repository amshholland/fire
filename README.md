# FIRE App

**Financial Independence Retire Early** - A personal finance application with bank account integration powered by Plaid.

## Overview

This is a full-stack application that helps users track their finances by connecting to their bank accounts via Plaid. The app features:

- 🔐 Google OAuth authentication with persistent login
- 🏦 Secure bank account connection via Plaid
- 💳 Real-time transaction tracking
- 📊 Transaction categorization and analysis
- 🎨 Modern UI with Ant Design

## Project Structure

```
fire/
├── backend/          # Express.js API server with Plaid integration
├── frontend/         # React frontend application
└── package.json      # Root package with unified scripts
```

## Prerequisites

- Node.js 18+ installed
- Google OAuth Client ID (for authentication)
- Plaid API credentials (for bank integration)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fire
```

### 2. Install All Dependencies

```bash
npm run install:all
```

This installs dependencies for the root, backend, and frontend.

### 3. Configure Environment Variables

**Backend** (`backend/.env`):

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add:

- `PLAID_CLIENT_ID` - Get from https://dashboard.plaid.com/team/keys
- `PLAID_SECRET` - Get from https://dashboard.plaid.com/team/keys
- `PLAID_ENV=sandbox` (for testing)

**Frontend** (`frontend/.env`):

```bash
cd ../frontend
touch .env
```

Edit `frontend/.env` and add:

- `REACT_APP_GOOGLE_CLIENT_ID` - Get from Google Cloud Console

### 4. Run the Application

**Start both frontend and backend with one command:**

```bash
npm start
```

This will start:

- Backend server on http://localhost:3001
- Frontend dev server on http://localhost:3000

**Or run them separately:**

```bash
# Backend only
npm run start:backend

# Frontend only
npm run start:frontend
```

## Available Scripts

- `npm start` - Run both frontend and backend concurrently
- `npm run install:all` - Install dependencies for all packages
- `npm run build` - Build both frontend and backend for production
- `npm run test` - Run tests for both frontend and backend
- `npm run start:backend` - Run backend only
- `npm run start:frontend` - Run frontend only

## Getting API Credentials

### Plaid (Bank Integration)

1. Sign up at <https://dashboard.plaid.com/signup>
2. Create a new application
3. Copy your `client_id` and `secret` from the Keys section
4. Use `sandbox` environment for free testing with test credentials

### Google OAuth (Authentication)

1. Go to <https://console.cloud.google.com/>
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3000` to authorized JavaScript origins
6. Copy your Client ID

## Testing with Sandbox Data

When using Plaid's sandbox environment, use these test credentials:

- Username: `user_good`
- Password: `pass_good`
- Select any bank (e.g., "Chase")

More test credentials: <https://plaid.com/docs/sandbox/test-credentials/>

## Technology Stack

**Frontend:**

- React 19 with TypeScript
- Ant Design UI components
- React Plaid Link
- Google OAuth

**Backend:**

- Node.js with Express
- TypeScript
- Plaid API SDK
- In-memory storage (upgrade to database for production)

## Development Notes

- Authentication state persists in localStorage
- Access tokens currently stored in-memory (backend restarts clear data)
- CORS configured for `http://localhost:3000`
- Frontend proxies `/api/*` requests to backend

## Production Considerations

Before deploying to production:

- [ ] Add a database (PostgreSQL, MongoDB, etc.)
- [ ] Implement proper access token storage and user association
- [ ] Set up proper session management
- [ ] Configure production Plaid environment
- [ ] Set up HTTPS
- [ ] Add environment-specific CORS configuration
- [ ] Implement proper error logging and monitoring
