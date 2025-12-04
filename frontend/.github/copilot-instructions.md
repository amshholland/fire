# Project Coding Standards & Guidelines

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
- Avoid side effects unless intentional.
- Return early when helpful.
- Don’t repeat yourself.
- Comments explain intent, not implementation.

---

If Copilot follows everything in here, we’re best friends.

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
