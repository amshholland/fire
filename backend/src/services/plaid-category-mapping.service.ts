/**
 * Plaid Category Mapping Service
 * 
 * Maps Plaid's categorization system to the app's internal category system.
 * This allows automatic categorization of transactions based on Plaid's suggestions.
 * 
 * STRATEGY:
 * - Plaid provides primary categories (e.g., "FOOD_AND_DRINK", "TRANSPORTATION")
 * - App has internal categories (e.g., "Groceries", "Dining Out", "Gas")
 * - This service provides intelligent mapping between the two systems
 * - Users can override the mapping on a per-transaction basis
 */

import { db } from '../db/database';

/**
 * Map Plaid primary category to app category ID
 * 
 * Uses Plaid's primary category to find the best matching app category.
 * Falls back gracefully if no mapping exists.
 * 
 * @param plaidPrimaryCategory - Plaid primary category (e.g., "FOOD_AND_DRINK")
 * @returns App category ID, or null if no mapping found
 */
export function mapPlaidToAppCategory(plaidPrimaryCategory: string | null): number | null {
  if (!plaidPrimaryCategory) {
    return null;
  }

  // Mapping of Plaid primary categories to app category names
  // Based on common Plaid categories: https://plaid.com/docs/api/transactions/#transaction-categories
  const plaidCategoryMapping: Record<string, string> = {
    // Food & Drink
    'FOOD_AND_DRINK': 'Dining Out',
    'FOOD_AND_DRINK_GROCERIES': 'Groceries',
    'FOOD_AND_DRINK_RESTAURANTS': 'Dining Out',
    'FOOD_AND_DRINK_COFFEE_SHOPS': 'Dining Out',
    'FOOD_AND_DRINK_FAST_FOOD': 'Dining Out',
    'FOOD_AND_DRINK_BARS': 'Dining Out',
    'FOOD_AND_DRINK_FOOD_DELIVERY': 'Dining Out',
    
    // Transportation
    'TRANSPORTATION': 'Transportation',
    'TRANSPORTATION_PUBLIC_TRANSIT': 'Transportation',
    'TRANSPORTATION_TAXI': 'Transportation',
    'TRANSPORTATION_PARKING': 'Transportation',
    'TRANSPORTATION_GAS': 'Gas',
    'TRANSPORTATION_TOLLS': 'Transportation',
    'TRANSPORTATION_RENTAL_CARS': 'Transportation',
    'TRANSPORTATION_FLIGHTS': 'Travel',
    'TRANSPORTATION_RIDESHARE': 'Transportation',
    
    // Shopping
    'SHOPPING': 'Shopping',
    'SHOPPING_CLOTHING': 'Shopping',
    'SHOPPING_ELECTRONICS': 'Shopping',
    'SHOPPING_SPORTING_GOODS': 'Shopping',
    'SHOPPING_HOME_SUPPLIES': 'Shopping',
    'SHOPPING_FURNITURE': 'Shopping',
    
    // Entertainment
    'ENTERTAINMENT': 'Entertainment',
    'ENTERTAINMENT_MOVIES': 'Entertainment',
    'ENTERTAINMENT_MUSIC': 'Entertainment',
    'ENTERTAINMENT_GAMES': 'Entertainment',
    'ENTERTAINMENT_AMUSEMENT': 'Entertainment',
    'ENTERTAINMENT_SPORTS': 'Entertainment',
    'ENTERTAINMENT_GYMS': 'Health & Fitness',
    
    // Personal Care
    'PERSONAL_CARE': 'Personal Care',
    'PERSONAL_CARE_SALON': 'Personal Care',
    'PERSONAL_CARE_LAUNDRY': 'Personal Care',
    
    // Health & Medical
    'MEDICAL': 'Health & Medical',
    'MEDICAL_DENTIST': 'Health & Medical',
    'MEDICAL_OPTOMETRIST': 'Health & Medical',
    'MEDICAL_PHARMACY': 'Health & Medical',
    'MEDICAL_HOSPITALS': 'Health & Medical',
    
    // Travel
    'TRAVEL': 'Travel',
    'TRAVEL_ACCOMMODATIONS': 'Travel',
    'TRAVEL_AIRLINES': 'Travel',
    'TRAVEL_RENTAL_CARS': 'Travel',
    'TRAVEL_TAXIS': 'Travel',
    
    // Utilities & Bills
    'BILLS_AND_UTILITIES': 'Utilities',
    'BILLS_AND_UTILITIES_ELECTRICITY': 'Utilities',
    'BILLS_AND_UTILITIES_GAS': 'Utilities',
    'BILLS_AND_UTILITIES_WATER': 'Utilities',
    'BILLS_AND_UTILITIES_PHONE': 'Utilities',
    'BILLS_AND_UTILITIES_INTERNET': 'Utilities',
    'BILLS_AND_UTILITIES_CABLE': 'Utilities',
    
    // Financial Services
    'FINANCIAL_SERVICES': 'Financial Services',
    'FINANCIAL_SERVICES_BANKS': 'Financial Services',
    'FINANCIAL_SERVICES_CREDIT_CARDS': 'Financial Services',
    
    // Government & Taxes
    'GOVERNMENT_AND_TAXES': 'Taxes',
    
    // Gifts & Donations
    'GIFTS_AND_DONATIONS': 'Gifts',
    
    // Rent & Property Management
    'RENT_AND_UTILITIES': 'Rent',
    'RENT_AND_UTILITIES_RENT': 'Rent',
    'RENT_AND_UTILITIES_MORTGAGE': 'Mortgage'
  };

  // Get the app category name from the mapping
  const appCategoryName = plaidCategoryMapping[plaidPrimaryCategory];

  if (!appCategoryName) {
    // No mapping found, return null to let user categorize
    return null;
  }

  // Look up the app category ID by name
  try {
    const query = `SELECT id FROM categories WHERE name = ? LIMIT 1`;
    const result = db.prepare(query).get(appCategoryName) as { id: number } | undefined;
    return result?.id ?? null;
  } catch (error) {
    console.error('Error looking up category ID:', error);
    return null;
  }
}

/**
 * Get categorization status
 * 
 * Returns a status string for display in the UI.
 * 
 * @param appCategoryId - App category ID (or null if uncategorized)
 * @param appCategoryName - App category name
 * @param plaidPrimaryCategory - Plaid primary category
 * @returns Status string for display
 */
export function getCategoryStatus(
  appCategoryId: number | null,
  appCategoryName: string | null,
  plaidPrimaryCategory: string | null
): string {
  if (appCategoryId && appCategoryName) {
    // User has explicitly categorized
    return appCategoryName;
  }

  if (plaidPrimaryCategory) {
    // No user categorization, but we have Plaid suggestion
    return `Suggested: ${plaidPrimaryCategory}`;
  }

  // No categorization at all
  return 'Needs Categorized';
}

/**
 * Suggest a category for a transaction
 * 
 * Uses Plaid categorization to suggest an app category.
 * Returns the suggestion along with the suggestion source.
 * 
 * @param plaidPrimaryCategory - Plaid primary category
 * @returns { categoryId: number | null, source: 'plaid' | 'none' }
 */
export function suggestCategory(plaidPrimaryCategory: string | null): {
  categoryId: number | null;
  source: 'plaid' | 'none';
} {
  const categoryId = mapPlaidToAppCategory(plaidPrimaryCategory);

  if (categoryId) {
    return {
      categoryId,
      source: 'plaid'
    };
  }

  return {
    categoryId: null,
    source: 'none'
  };
}
