/**
 * Mock budget data for development and testing
 * Provides realistic sample data matching the BudgetPageResponse interface
 */

interface CategoryBudget {
  category_id: number
  category_name: string
  budgeted_amount: number
  spent_amount: number
  remaining_amount: number
  percentage_used: number
}

interface BudgetSummary {
  total_budgeted: number
  total_spent: number
  total_remaining: number
  overall_percentage_used: number
}

interface BudgetPageResponse {
  month: number
  year: number
  categoryBudgets: CategoryBudget[]
  summary: BudgetSummary
}

export const mockBudgetData: BudgetPageResponse = {
  month: 12,
  year: 2025,
  categoryBudgets: [
    {
      category_id: 1,
      category_name: 'Groceries',
      budgeted_amount: 600,
      spent_amount: 485.32,
      remaining_amount: 114.68,
      percentage_used: 80.9
    },
    {
      category_id: 2,
      category_name: 'Dining Out',
      budgeted_amount: 300,
      spent_amount: 245.50,
      remaining_amount: 54.50,
      percentage_used: 81.8
    },
    {
      category_id: 3,
      category_name: 'Transportation',
      budgeted_amount: 400,
      spent_amount: 387.60,
      remaining_amount: 12.40,
      percentage_used: 96.9
    },
    {
      category_id: 4,
      category_name: 'Utilities',
      budgeted_amount: 250,
      spent_amount: 218.75,
      remaining_amount: 31.25,
      percentage_used: 87.5
    },
    {
      category_id: 5,
      category_name: 'Entertainment',
      budgeted_amount: 200,
      spent_amount: 189.99,
      remaining_amount: 10.01,
      percentage_used: 95.0
    },
    {
      category_id: 6,
      category_name: 'Shopping',
      budgeted_amount: 400,
      spent_amount: 520.45,
      remaining_amount: -120.45,
      percentage_used: 130.1
    },
    {
      category_id: 7,
      category_name: 'Fitness',
      budgeted_amount: 100,
      spent_amount: 100.00,
      remaining_amount: 0,
      percentage_used: 100.0
    },
    {
      category_id: 8,
      category_name: 'Healthcare',
      budgeted_amount: 300,
      spent_amount: 125.80,
      remaining_amount: 174.20,
      percentage_used: 41.9
    }
  ],
  summary: {
    total_budgeted: 2550,
    total_spent: 2273.41,
    total_remaining: 276.59,
    overall_percentage_used: 89.2
  }
}
