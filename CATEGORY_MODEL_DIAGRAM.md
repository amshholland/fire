# Category Model Data Relationships

## Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ id (PK)         │
│ email           │
│ google_id       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    ACCOUNTS     │
│─────────────────│
│ id (PK)         │◄────────┐
│ user_id (FK)    │         │
│ name            │         │
│ type            │         │
└────────┬────────┘         │
         │                  │
         │ 1:N              │ N:1
         ▼                  │
┌─────────────────┐         │
│  TRANSACTIONS   │         │
│─────────────────│         │
│ id (PK)         │         │
│ account_id (FK) │         │
│ user_id (FK)    │         │
│                 │         │
│ Plaid Data      │         │
│ (immutable):    │         │
│ ├─ plaid_cat... │         │
│ ├─ plaid_cat... │         │
│ └─ plaid_cat... │         │
│                 │         │
│ App Category:   │         │
│ └─ category_id ─┼─────┐   │
│    (FK)         │     │   │
└─────────────────┘     │   │
                        │   │
                        ▼   │
                  ┌──────────────┐
                  │  CATEGORIES  │
                  │──────────────│
                  │ id (PK)      │
                  │ name         │
                  │ is_system    │
                  │ account_id ──┼────┘
                  │ (FK nullable)│
                  └──────────────┘
                        △
                        │
            ┌───────────┴───────────┐
            │                       │
    is_system=1              is_system=0
    account_id=NULL          account_id=X
            │                       │
    System Categories       Account-Scoped
    (Global defaults)       (Per-account custom)
```

## Category Scoping Rules

### System Categories
- **Scope:** Global (all accounts)
- **Characteristics:**
  - `is_system = 1`
  - `account_id = NULL`
  - Cannot be deleted or modified
  - Available to all accounts automatically
- **Examples:** Groceries, Dining Out, Transportation

### Account-Scoped Categories
- **Scope:** Single account
- **Characteristics:**
  - `is_system = 0`
  - `account_id = <specific account>`
  - Can be created, updated, deleted
  - Only visible to specified account's transactions
- **Examples:** "Work Meals" (for business account), "Home Expenses" (for personal account)

## Transaction Categorization Flow

```
1. Plaid Sync (POST /api/user/:userId/transactions/sync)
   ├─> Fetch transactions from Plaid API
   ├─> Extract: personal_finance_category.primary → plaid_category_primary
   ├─> Extract: personal_finance_category.detailed → plaid_category_detailed
   ├─> Extract: personal_finance_category.confidence_level → plaid_category_confidence
   └─> Save to database (UNIQUE constraint on plaid_transaction_id prevents duplicates)

2. Initial Categorization
   └─> category_id = NULL (uncategorized, ready for user assignment)

3. User Override (Optional)
   └─> Update category_id to system or account-scoped category

4. Budget/Report Queries
   └─> Use category_id (authoritative)
   └─> Plaid categories available for reference/audit
```

## Plaid Transaction Sync Implementation

### Duplicate Prevention
- **UNIQUE constraint** on `plaid_transaction_id` column
- Automatic duplicate detection (no manual checking needed)
- SQLite returns error on duplicate insert (caught and skipped)

### Category Data Extraction
```typescript
// From Plaid API response
const tx = {
  transaction_id: "xyz123",
  personal_finance_category: {
    primary: "FOOD_AND_DRINK",
    detailed: "FOOD_AND_DRINK_RESTAURANTS",
    confidence_level: 0.95
  }
}

// Stored in database
{
  plaid_transaction_id: "xyz123",
  plaid_category_primary: "FOOD_AND_DRINK",
  plaid_category_detailed: "FOOD_AND_DRINK_RESTAURANTS", 
  plaid_category_confidence: 0.95,
  category_id: null  // User can assign later
}
```

### Frontend Display
- **Plaid Category** column: Shows `plaid_category_primary` with confidence %
- **App Category** column: Shows user's assigned category or "Uncategorized"
- Side-by-side comparison enables users to see both categorizations

## Key Design Principles

### 1. Plaid Categories = Input Data
- Stored verbatim, never modified
- Used for audit, debugging, ML training
- **NOT** used for budgets or reports

### 2. App Categories = Source of Truth
- `category_id` drives all business logic
- Users can override per transaction
- Supports both global and account-specific categories

### 3. Account-Scoped, Not User-Scoped
- Categories belong to accounts, not users
- Enables different categorization per account
- User with multiple accounts can have different categories for each

### 4. Future-Proof for Rules Engine
- Plaid data preserved for rule creation
- Account-scoped categories enable per-account rules
- No coupling between Plaid categories and app categories

## Query Patterns

### Get categories for an account
```sql
SELECT * FROM categories 
WHERE is_system = 1 OR account_id = ?
```
Returns: System categories + account-specific categories

### Get transactions with categories
```sql
SELECT t.*, c.name as category_name
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.account_id = ?
```
Returns: Transactions with app category (not Plaid category)

### Override transaction category
```sql
UPDATE transactions 
SET category_id = ? 
WHERE id = ?
```
Note: Plaid category fields remain unchanged
