/**
 * Budget Setup Page Types (Frontend)
 * 
 * Mirrors backend DTOs for type safety across the stack.
 * Used for budget creation form state and API communication.
 */

/**
 * Budget Setup Item
 * 
 * Represents a single category budget allocation.
 */
export interface BudgetSetupItem {
  /**
   * Category ID (foreign key reference)
   */
  category_id: number;

  /**
   * Category name (for display)
   */
  category_name: string;

  /**
   * Planned/budgeted amount
   * Must be non-negative
   */
  planned_amount: number;
}

/**
 * Budget Setup Request
 * 
 * Payload for creating budgets via API.
 */
export interface BudgetSetupRequest {
  /**
   * User ID (from auth context)
   */
  user_id: string;

  /**
   * Budget month (1-12)
   */
  month: number;

  /**
   * Budget year (YYYY)
   */
  year: number;

  /**
   * Array of budget allocations
   */
  budgets: BudgetSetupItem[];
}

/**
 * Budget Setup Response
 * 
 * Response from budget creation API.
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
