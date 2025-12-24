# API Reference - Financial Management Endpoints

Base URL: `http://localhost:3030/api`

---

## Users

### Create User
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 201 Created
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-12-23T...",
    "has_linked_plaid": false,
    "onboarding_completed": false
  }
}
```

### Get User
```http
GET /users/:userId
GET /users/by-email/:email

Response: 200 OK
{
  "user": { ... }
}
```

### Update User
```http
PATCH /users/:userId
Content-Type: application/json

{
  "has_linked_plaid": true,
  "onboarding_completed": true
}

Response: 200 OK
{
  "user": { ... }
}
```

### Update Plaid Status
```http
POST /users/:userId/plaid-linked
Content-Type: application/json

{
  "hasLinked": true
}

Response: 200 OK
{
  "user": { ... }
}
```

### Complete Onboarding
```http
POST /users/:userId/onboarding-complete
Content-Type: application/json

{
  "completed": true
}

Response: 200 OK
{
  "user": { ... }
}
```

---

## Accounts

### List User Accounts
```http
GET /user/:userId/accounts

Response: 200 OK
{
  "accounts": [
    {
      "id": 1,
      "user_id": "uuid",
      "plaid_account_id": "abc123",
      "name": "Chase Checking",
      "type": "depository",
      "subtype": "checking",
      "current_balance": 5000.00,
      "institution": "Chase"
    }
  ]
}
```

### Get Account Details
```http
GET /user/:userId/accounts/:accountId

Response: 200 OK
{
  "account": { ... }
}
```

### Create Account
```http
POST /user/:userId/accounts
Content-Type: application/json

{
  "name": "Savings Account",
  "type": "depository",
  "subtype": "savings",
  "current_balance": 10000,
  "institution": "Bank of America"
}

Response: 201 Created
{
  "account": { ... }
}
```

### Update Account
```http
PATCH /user/:userId/accounts/:accountId
Content-Type: application/json

{
  "current_balance": 5500.00
}

Response: 200 OK
{
  "account": { ... }
}
```

### Delete Account
```http
DELETE /user/:userId/accounts/:accountId

Response: 200 OK
{
  "success": true
}
```

### Get Total Balance
```http
GET /user/:userId/accounts-total-balance

Response: 200 OK
{
  "totalBalance": 15000.00
}
```

---

## Transactions

### List Transactions (with filters)
```http
GET /user/:userId/transactions?accountId=1&startDate=2025-01-01&endDate=2025-12-31&limit=50

Query Parameters:
- accountId (optional): Filter by account
- categoryId (optional): Filter by category
- startDate (optional): YYYY-MM-DD format
- endDate (optional): YYYY-MM-DD format
- limit (optional): Max results
- offset (optional): Pagination offset

Response: 200 OK
{
  "transactions": [
    {
      "id": 1,
      "user_id": "uuid",
      "account_id": 1,
      "plaid_transaction_id": "tx_123",
      "date": "2025-12-20",
      "amount": -45.32,
      "merchant": "Whole Foods",
      "category_id": 1,
      "is_manual": false
    }
  ],
  "count": 1
}
```

### Get Transaction Details
```http
GET /user/:userId/transactions/:transactionId

Response: 200 OK
{
  "transaction": { ... }
}
```

### Create Manual Transaction
```http
POST /user/:userId/transactions/manual
Content-Type: application/json

{
  "account_id": 1,
  "date": "2025-12-23",
  "amount": -25.00,
  "merchant": "Coffee Shop",
  "category_id": 2
}

Response: 201 Created
{
  "transaction": { ... }
}
```

### Update Transaction
```http
PATCH /user/:userId/transactions/:transactionId
Content-Type: application/json

{
  "category_id": 3,
  "merchant": "Updated Merchant"
}

Response: 200 OK
{
  "transaction": { ... }
}
```

### Delete Transaction
```http
DELETE /user/:userId/transactions/:transactionId

Response: 200 OK
{
  "success": true
}
```

---

## Categories

### List All Categories (System + Custom)
```http
GET /user/:userId/categories

Response: 200 OK
{
  "categories": [
    {
      "id": 1,
      "name": "Groceries",
      "is_system": true,
      "user_id": null
    },
    {
      "id": 13,
      "name": "Pet Expenses",
      "is_system": false,
      "user_id": "uuid"
    }
  ]
}
```

### Get System Categories
```http
GET /categories/system

Response: 200 OK
{
  "categories": [
    { "id": 1, "name": "Groceries", "is_system": true, "user_id": null },
    { "id": 2, "name": "Dining Out", "is_system": true, "user_id": null },
    ...
  ]
}
```

### Get User Custom Categories
```http
GET /user/:userId/categories/custom

Response: 200 OK
{
  "categories": [...]
}
```

### Create Custom Category
```http
POST /user/:userId/categories
Content-Type: application/json

{
  "name": "Pet Expenses"
}

Response: 201 Created
{
  "category": {
    "id": 13,
    "name": "Pet Expenses",
    "is_system": false,
    "user_id": "uuid"
  }
}
```

### Update Category
```http
PATCH /user/:userId/categories/:categoryId
Content-Type: application/json

{
  "name": "Pet Care"
}

Response: 200 OK
{
  "category": { ... }
}
```

### Delete Category
```http
DELETE /user/:userId/categories/:categoryId

Response: 200 OK
{
  "success": true
}
```

---

## Budgets

### List Budgets
```http
GET /user/:userId/budgets?month=12&year=2025

Query Parameters:
- month (optional): 1-12
- year (optional): YYYY

Response: 200 OK
{
  "budgets": [
    {
      "id": 1,
      "user_id": "uuid",
      "category_id": 1,
      "month": 12,
      "year": 2025,
      "amount": 500.00
    }
  ]
}
```

### Get Total Budget
```http
GET /user/:userId/budgets/total?month=12&year=2025

Required Query Parameters:
- month: 1-12
- year: YYYY

Response: 200 OK
{
  "total": 2500.00,
  "month": 12,
  "year": 2025
}
```

### Create/Update Budget (Upsert)
```http
POST /user/:userId/budgets
Content-Type: application/json

{
  "category_id": 1,
  "month": 12,
  "year": 2025,
  "amount": 600.00
}

Response: 201 Created
{
  "budget": { ... }
}
```

### Delete Budget
```http
DELETE /user/:userId/budgets/:budgetId

Response: 200 OK
{
  "success": true
}
```

---

## Net Worth & Assets/Liabilities

### Get Net Worth
```http
GET /user/:userId/net-worth

Response: 200 OK
{
  "netWorth": 50000.00,
  "breakdown": {
    "accountBalance": 15000.00,
    "manualAssets": 250000.00,
    "manualLiabilities": 215000.00
  }
}
```

### List Assets & Liabilities
```http
GET /user/:userId/assets-liabilities

Response: 200 OK
{
  "items": [
    {
      "id": 1,
      "user_id": "uuid",
      "name": "House",
      "type": "asset",
      "value": 250000.00,
      "is_manual": true
    },
    {
      "id": 2,
      "user_id": "uuid",
      "name": "Mortgage",
      "type": "liability",
      "value": 200000.00,
      "is_manual": true
    }
  ]
}
```

### Create Asset/Liability
```http
POST /user/:userId/assets-liabilities
Content-Type: application/json

{
  "name": "Car",
  "type": "asset",
  "value": 25000.00
}

Response: 201 Created
{
  "item": { ... }
}
```

### Update Asset/Liability
```http
PATCH /user/:userId/assets-liabilities/:itemId
Content-Type: application/json

{
  "value": 24000.00
}

Response: 200 OK
{
  "item": { ... }
}
```

### Delete Asset/Liability
```http
DELETE /user/:userId/assets-liabilities/:itemId

Response: 200 OK
{
  "success": true
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "name and type are required"
}
```

### 404 Not Found
```json
{
  "error": "Account not found"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## System Categories (Seeded on Startup)

1. Groceries
2. Dining Out
3. Transportation
4. Entertainment
5. Shopping
6. Bills & Utilities
7. Healthcare
8. Insurance
9. Education
10. Personal Care
11. Income
12. Other

---

## Notes

- All amounts are in dollars (decimal)
- Dates use YYYY-MM-DD format
- UUIDs are used for user IDs
- Auto-incrementing integers for other entity IDs
- Database is in-memory and resets on server restart
- Foreign key cascades delete related records
