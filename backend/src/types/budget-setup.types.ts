/**
 * Budget Setup Page Data Transfer Objects
 * 
 * Defines the data contract for creating monthly budgets.
 * This DTO is used for the budget creation/setup page where users
 * allocate budgeted amounts to categories for a specific month/year.
 * 
 * SCOPE:
 * - Budget creation form data
 * - No transaction or spending data
 * - No persistence logic (handled by routes/services)
 * 
 * DATA SOURCES:
 * - User input (month, year, planned_amount)
 * - Category reference (category_id, category_name from Category table)
 */

/**
 * Budget Setup Item
 * 
 * Represents a single category budget allocation for creation.
 */
export interface BudgetSetupItem {
  /**
   * Category ID
   * SOURCE: Category.id
   * TYPE: number (integer, foreign key)
   * REQUIRED: Yes
   * VALIDATION: Must reference existing category
   */
  category_id: number;

  /**
   * Category name (for display)
   * SOURCE: Category.name
   * TYPE: string
   * EXAMPLE: "Groceries", "Dining Out"
   * REQUIRED: Yes
   * NOTE: Read-only reference, not editable in budget setup
   */
  category_name: string;

  /**
   * Planned/budgeted amount for this category
   * TYPE: number (decimal)
   * EXAMPLE: 300.00
   * REQUIRED: Yes
   * VALIDATION:
   * - Must be non-negative (>= 0)
   * - Stored with 2 decimal precision
   * - Zero budgets are allowed
   */
  planned_amount: number;
}

/**
 * Budget Setup Request
 * 
 * Request payload for creating budgets for a specific month/year.
 * Contains all budget allocations for the period.
 */
export interface BudgetSetupRequest {
  /**
   * User ID
   * SOURCE: Authentication context
   * TYPE: string (UUID)
   * REQUIRED: Yes
   */
  user_id: string;

  /**
   * Budget month (1-12)
   * TYPE: number (integer)
   * REQUIRED: Yes
   * VALIDATION: Must be between 1 and 12
   */
  month: number;

  /**
   * Budget year (YYYY)
   * TYPE: number (integer)
   * EXAMPLE: 2025
   * REQUIRED: Yes
   * VALIDATION: Reasonable range (1970-2100)
   */
  year: number;

  /**
   * Array of budget items (category allocations)
   * TYPE: BudgetSetupItem[]
   * REQUIRED: Yes
   * VALIDATION:
   * - Cannot be empty
   * - Each category_id must be unique
   * - All category_ids must exist
   */
  budgets: BudgetSetupItem[];
}

/**
 * Budget Setup Response
 * 
 * Response after creating budgets (when API is implemented).
 * Currently a placeholder for future implementation.
 */
export interface BudgetSetupResponse {
  /**
   * Success indicator
   */
  success: boolean;

  /**
   * Number of budgets created
   */
  count: number;

  /**
   * Month of created budgets
   */
  month: number;

  /**
   * Year of created budgets
   */
  year: number;
}

/**
 * IMPLEMENTATION NOTES (NOT IMPLEMENTED IN THIS TICKET):
 * 
 * 1. Database Persistence:
 *    - Insert/update Budget table records
 *    - Handle UPSERT logic (replace existing budgets for same month/year)
 *    - Validate category_id references exist
 * 
 * 2. Validation Rules:
 *    - Month: 1-12
 *    - Year: 1970-2100 (reasonable range)
 *    - planned_amount: >= 0, 2 decimal places
 *    - category_id: Must exist in categories table
 *    - Unique category_id per request (no duplicates)
 * 
 * 3. Business Rules:
 *    - Replacing existing budgets: UPSERT behavior
 *    - Zero budgets: Allowed (category tracked but no allocation)
 *    - Missing categories: Not included in request (no budget for that month)
 * 
 * 4. API Endpoint Pattern (Future):
 *    POST /api/budgets/setup
 *    Body: BudgetSetupRequest
 *    Response: BudgetSetupResponse
 * 
 * 5. Frontend Form Considerations:
 *    - Display all user categories
 *    - Pre-populate with existing budgets for month/year
 *    - Allow editing planned_amount
 *    - Validate positive numbers
 *    - Show category names (read-only)
 * 
 * 6. Edge Cases:
 *    - Updating existing budget (UPSERT)
 *    - Creating budget for future months
 *    - Categories with zero allocations
 *    - User with no categories yet (show empty form)
 */
