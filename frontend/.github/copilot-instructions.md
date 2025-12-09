# Copilot Instructions

## Project Coding Standards & Guidelines

A reference document to help Copilot (and humans) write consistent, clean, maintainable code.

---

## 🎯 Project Goals

- Build a secure, scalable, and readable codebase.
- Prioritize clarity over cleverness.
- Follow clean code principles: small functions, clear names, single responsibility.

---

## 🧱 General Standards

- **Write code for humans first, machines second.**
- Keep functions short and focused.
- Avoid magic values—use constants or configs.
- Prefer composition over inheritance.
- Use dependency injection when reasonable.

---

## 📦 Naming Conventions

**Files / Modules**

- `kebab-case` for filenames.
- One component/class per file.

**Variables & Functions**

- `camelCase` for variables and functions.
- Use descriptive names: `getUserProfile` > `getData`.
- Booleans should read like questions: `isValid`, `hasAccess`, `shouldRetry`.

**Classes**

- `PascalCase` for classes and React components.

**Constants**

- `UPPER_SNAKE_CASE` for config-like values.

---

## 🧪 Testing Guidelines
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
- Test coverage excludes `src/index.js` (see package.json jest config)

- Test critical logic and edge cases.
- Prefer **unit tests** with mock dependencies.
- Keep tests deterministic.
- Use clear naming: `should_doThing_when_condition`.

---

## 🔐 Security Standards

- Never log sensitive data.
- Validate **all input**, even trusted sources.
- Use parameterized queries.
- Follow the principle of least privilege.
- Escape output in UI to avoid XSS.

---

## 📚 Documentation

- Every module should have a short description at the top.
- Use docstrings or JSDoc where helpful.
- Comment "why", not "what".

---

## 🌐 API & Integration

- All API calls must go through a single client abstraction layer.
- Use typed request/response models.
- Handle errors gracefully with retries where needed.

---

## 🎨 Frontend (If Applicable)

- Use functional components.
- Keep components small, focused, and reusable.
- Avoid deep prop drilling—use context/state management as needed.
- Use semantic HTML.

---

## 🧰 Git Standards

- Write meaningful commit messages: `feat: add login service`.
- Small, incremental commits.
- Branch naming: `feature/login-form`, `bugfix/token-refresh`, etc.

---

## 🔄 Code Review Expectations

- Be kind.
- Point out unclear naming.
- Request simplification where complexity isn’t necessary.
- Never block on style—automate with linters.

---

## 🤝 Contribution Style

- Keep PRs lean.
- Include screenshots for UI changes.
- Provide context for major refactors.

---

## 🧹 Clean Code Quick Reminders

- Do one thing per function.
- One level of abstraction per function.
- Avoid side effects unless intentional.
- Return early when helpful.
- Don’t repeat yourself.
- Avoid comments.
- Use intention-revealing names.
- Use the step-down rule:
  - Code reads like a top-down narrative. We want every function to be followed by those at the next level of abstraction so we can read the program descending one level of abstraction at a time as we read down the list of functions.
- Test code should be maintained at the same standards of quality as production code.
- Structure tests with the BUILD->OPERATE->CHECK pattern
- Use the Given-When-Then approach:
  - Given: state before the behavior
  - When: behavior
  - Then: expected state after the behavior.
- Minimize the number of asserts in tests.
- Minimize the number of asserts per concept and test just one concept per test function.
- Follow the FIRST Rules for Clean Tests:
  - Fast – should run quickly
  - Independent – should not depend on each other
  - Repeatable – should be repeatable in any environment
  - Self-Validating – should either pass or fail
  - Timely – needs to be written just before production code

## Tech Stack & Implementation Guidelines

### React

- Use functional components exclusively.
- Prefer hooks (`useState`, `useReducer`, `useMemo`, `useCallback`).
- Use React Query for all async data management.
- Keep components small; max ~200 lines.

### TypeScript

- Enable strict mode.
- No `any` unless temporary and commented.
- Use type aliases for objects; interfaces only for library-level types.
- Always type props and API responses.

### Google OAuth

- Implement Google Identity Services.
- Tokens handled by backend (httpOnly cookies recommended).
- Avoid storing tokens in localStorage.

### Plaid Integration

- Use Link token flow.
- Backend exchanges public token for access token.
- Frontend never handles secrets.
- Log Plaid errors with correlation IDs.

### Backend (TBD)

- Minimal data collection: budgets, categories, transactions.
- Database options open (Postgres, DynamoDB, etc.).
- Encrypt data in transit and at rest.
- Consider tRPC or OpenAPI for strong typing.

### File Organization

- Entry points: `packages/backend/src/index.tsx`, `packages/frontend/src/index.tsx`
- Testable logic: Exported from `App.tsx`, imported by `index.tsx` and tests
- Tests: `__tests__/` directories (backend) or `src/__tests__/` (frontend)
