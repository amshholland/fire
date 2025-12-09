# Copilot Instructions

## Project Overview

This is a **monorepo** with a React frontend (`packages/frontend`) and Node.ts Express backend (`packages/backend`) using npm workspaces. The backend uses **better-sqlite3 with an in-memory database** that resets on every restart.

## Architecture

### Backend (packages/backend)

- **Express app** exports `{ app, db, insertStmt }` from `src/app.ts` for testing
- **In-memory SQLite**: Database is `:memory:`, initialized on startup with sample data
- **Port**: 3030 by default
- **Single table schema**: `items(id, name, created_at)`
- **API endpoints**: 
  - `GET /api/items` - returns all items ordered by created_at DESC
  - `POST /api/items` - requires `{ name: string }`, returns 201 with created item

### Frontend (packages/frontend)

- **React 18** with functional components and hooks
- **Proxied requests**: `proxy: "http://localhost:3030"` in package.tson routes `/api/*` to backend
- **State management**: useState/useEffect only, no Redux
- **Fetch pattern**: Uses native `fetch()` API, not axios despite dependency

## Developer Workflows

### Running the application

```bash
# Install all dependencies (root + workspaces)
npm run install:all

# Start both frontend (port 3000) and backend (port 3030) concurrently
npm start

# Or start individually
npm run start:frontend  # React dev server on :3000
npm run start:backend   # Nodemon on :3030
```

### Testing

```bash
# Run all tests
npm test

# Test individual packages
npm run test:frontend  # Jest via react-scripts with coverage
npm run test:backend   # Jest with supertest

# Frontend watch mode (useful during development)
npm run test:watch --workspace=frontend
```

## Testing Conventions

### Backend Tests (packages/backend/__tests__/)

- Use **supertest** to test Express endpoints without starting server
- Import `{ app, db }` from `../src/app` 
- **Always close database** in `afterAll(() => db.close())` to avoid open handles
- Use `--detectOpenHandles` flag in jest script

### Frontend Tests (packages/frontend/src/__tests__/)

- Use **msw (Mock Service Worker)** to mock API calls
- Setup pattern: `setupServer()` → `beforeAll(server.listen)` → `afterAll(server.close)`
- Wrap initial renders in `act()` when data fetching occurs
- Test coverage excludes `src/index.ts` (see package.tson jest config)

## Key Patterns

### Database Setup (Backend)

The database is recreated on every server start:

```javascript
const db = new Database(':memory:');
db.exec(`CREATE TABLE...`);
const insertStmt = db.prepare('INSERT...');
```

**Implication**: No persistent data between restarts. Use this pattern for all table creation.

### API Error Handling

Consistent error response format:

```javascript
res.status(400).tson({ error: 'Description of error' });
```

Frontend displays errors as: `'Failed to fetch data: ' + err.message`

### Frontend Data Flow

1. `useEffect` calls `fetchData()` on mount
2. User adds item → `handleSubmit` → POST request → optimistic update: `setData([...data, result])`
3. No refetch after POST; new item appended to state directly

## File Organization

- Entry points: `backend/src/index.ts`, `frontend/src/index.ts`
- Testable logic: Exported from `app.ts`, imported by `index.ts` and tests
- Tests: `__tests__/` directories (backend) or `src/__tests__/` (frontend)
