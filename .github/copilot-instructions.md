# Copilot Instructions

## Project Overview

**FIRE App** (Financial Independence Retire Early) - A full-stack personal finance application with Plaid bank integration and Google OAuth authentication. Monorepo structure with React frontend and Express backend.

## Architecture

### Backend (`backend/`)

- **Express + TypeScript** server with Plaid API integration
- **Port**: 3001 by default (configurable via `APP_PORT` in env)
- **Database**: SQLite with better-sqlite3
  - In-memory (`:memory:`) in development/tests
  - File-based (`data/fire.db`) in production
  - Initialized on startup via `initializeDatabase()` + `seedDatabase()` (non-prod)
- **Core tables**: `users`, `accounts`, `transactions`, `budgets`, `categories`
- **State management**: In-memory `state` object (`state/store.ts`) stores Plaid tokens during session
- **Entry point**: `server.ts` (not `index.ts`) - imports routes, initializes DB, starts server

### Frontend (`frontend/`)

- **React 19** with TypeScript, functional components, hooks
- **Port**: 3000 (Create React App dev server)
- **Proxy**: `"proxy": "http://localhost:3030"` routes `/api/*` to backend
- **Authentication flow**: Google OAuth → Plaid Link setup → Dashboard
- **State**: Context API (`plaidContext`) + custom hooks, no Redux
- **UI**: Ant Design components
- **Entry**: `index.tsx` → `App.tsx` → conditional page routing based on auth state

### Key Integration Points

**Plaid Integration** (`backend/src/clients/plaidClient.ts`):
- Singleton `PlaidApi` instance configured from `config/env.ts`
- Environment-specific URLs: sandbox/development/production
- Headers include `PLAID-CLIENT-ID`, `PLAID-SECRET`, `Plaid-Version: 2020-09-14`

**Authentication States** (see `frontend/src/hooks/useAppAuthState.ts`):
- `loading` → `unauthenticated` → `google_authenticated` → `plaid_pending` → `authenticated`
- Error state: `plaid_error` if link token fails

**API Routes** (`backend/src/routes/*.ts`):
- All routers export named constant: `export const transactionsRouter = Router()`
- Mounted at `/api` prefix in `server.ts`
- Follow pattern: validation → business logic → response with consistent error format

## Developer Workflows

### Setup & Installation

```bash
npm run install:all    # Install root + backend + frontend dependencies
```

### Running the Application

```bash
npm start              # Concurrently start backend (3001) + frontend (3000)
npm run start:backend  # Backend only: tsx watch src/server.ts
npm run start:frontend # Frontend only: react-scripts start
```

### Environment Variables

**Backend** (`backend/.env`):
- `PLAID_CLIENT_ID`, `PLAID_SECRET` - From Plaid dashboard
- `PLAID_ENV=sandbox` - Environment: sandbox/development/production
- `APP_PORT=3001` - Server port (optional)

**Frontend** (`frontend/.env`):
- `REACT_APP_GOOGLE_CLIENT_ID` - From Google Cloud Console

### Testing

```bash
npm test               # Run all tests (backend + frontend)
cd backend && npm test # Backend only: jest with --detectOpenHandles
cd frontend && npm test # Frontend only: react-scripts test
```

**Backend test patterns** (`backend/src/**/__tests__/`):
- Use `supertest` to test Express routes without starting server
- Import testable units directly (e.g., `import { transactionsRouter } from '../transactions'`)
- Database: Call `initializeDatabase()` + `seedDatabase()` in `beforeAll()`
- **Critical**: Always `db.close()` in `afterAll()` to prevent open handles
- Mock external clients: `jest.mock('../../clients/plaidClient')`

**Frontend test patterns** (`frontend/src/**/*.test.tsx`):
- Use `@testing-library/react` for component testing
- Simple snapshot/render tests for most components (see `Dashboard.test.tsx`)
- No MSW setup found in codebase (previous instructions outdated)

## Project-Specific Conventions

### File Naming & Structure

- **Directories**: `kebab-case` (e.g., `user-categories/`)
- **Files**: `kebab-case.ts` (e.g., `budget-calculator.service.ts`)
- **React components**: `PascalCase.tsx` (e.g., `BudgetPage.tsx`)
- **Tests**: Co-located in `__tests__/` subdirectories

### Code Organization Layers

1. **Routes** (`backend/src/routes/`) - HTTP handlers, validation, response formatting
2. **Services** (`backend/src/services/`) - Pure business logic, calculations (no DB, no side effects)
3. **DAL** (`backend/src/db/*-dal.ts`) - Data access layer, SQL queries
4. **Clients** (`backend/src/clients/`) - External API wrappers (Plaid)

**Example flow**: Route → Service → DAL → Database

### Database Patterns

**Initialization** (see `backend/src/db/database.ts`):
```typescript
export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');  // Always enable
```

**Query style**: Use prepared statements from better-sqlite3
```typescript
const stmt = db.prepare('SELECT * FROM transactions WHERE user_id = ?');
const results = stmt.all(userId);
```

**Transaction handling**: Wrap mutations in transactions for consistency

### API Conventions

**Error responses**: Always use consistent format
```typescript
res.status(400).json({ error: 'Description of error' });
```

**Pagination**: Standard query params (see `transactions.ts` `/transactions/db`)
- `page` (1-indexed), `page_size` (default 50, max 100)
- Return: `{ transactions: [], total_count, page, page_size }`

### Service Layer Pattern

Services are **pure calculation functions** with no side effects:
```typescript
// ✅ Good: Pure function
export function calculateCategoryRemaining(budgeted: number, spent: number): number {
  return budgeted - spent;
}

// ❌ Bad: Service with database writes or external calls
```

See `budget-calculator.service.ts` and `spending-aggregation.service.ts` as examples.

### Frontend Hook Pattern

Custom hooks manage concerns:
- `useUserAuth` - Google OAuth state, login/logout handlers
- `useAppAuthState` - Derive app state from auth + Plaid link status
- `useAppInitialization` - Fetch initial data on mount
- `usePlaidLinkHandler` - Plaid Link integration

All return consistent shapes with clear naming.

## Critical Knowledge

### Database Lifecycle

- **Development**: In-memory DB resets on server restart → no persistent data
- **Production**: File-based DB persists between restarts
- Test setup must call `initializeDatabase()` explicitly

### Plaid Token Flow

1. Frontend requests link token: `POST /api/create_link_token`
2. User completes Plaid Link UI
3. Frontend exchanges public token: `POST /api/set_access_token`
4. Backend stores access token in `state.ACCESS_TOKEN` (memory)
5. Subsequent API calls use access token from state

### Port Configuration Gotcha

- Frontend proxy points to `:3030` (see `frontend/package.json`)
- Backend default is `:3001` (see `backend/src/config/env.ts`)
- **For local dev**: Set `APP_PORT=3030` in `backend/.env` OR update frontend proxy

### Coding Standards Reference

See `coding_standards.md` for:
- Naming conventions (camelCase variables, PascalCase classes, UPPER_SNAKE_CASE constants)
- Security standards (never log sensitive data, parameterized queries)
- Git conventions (branch naming: `feature/`, `bugfix/`)

## Common Tasks

**Add new API endpoint**:
1. Create/update router in `backend/src/routes/*.ts`
2. Add to `server.ts` route registration
3. Create test in `routes/__tests__/*.test.ts`

**Add database table**:
1. Add schema in `db/database.ts` `initializeDatabase()`
2. Add seed data in `seedDatabase()` if needed
3. Create DAL functions in `db/*-dal.ts`

**Add new page**:
1. Create component in `frontend/src/pages/PageName/`
2. Add route logic in `App.tsx` based on auth state
3. Create corresponding hook if complex state management needed
