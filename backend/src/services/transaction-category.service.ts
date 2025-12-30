/**
 * Transaction Category Service
 * 
 * Pure validation logic for transaction category updates.
 * No database operations - only business rules.
 */

/**
 * Validate category update request
 * 
 * Ensures category_id is valid and accessible to the user.
 * 
 * @param categoryId - New category ID to assign
 * @param validCategoryIds - Array of valid category IDs for this user
 * @returns Validation result with error message if invalid
 */
export function validateCategoryUpdate(
  categoryId: number,
  validCategoryIds: number[]
): { valid: boolean; error?: string } {
  // Check if category_id is a positive integer
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return {
      valid: false,
      error: 'Invalid category_id: must be a positive integer'
    };
  }

  // Check if category exists in valid categories
  if (!validCategoryIds.includes(categoryId)) {
    return {
      valid: false,
      error: `Category ID ${categoryId} does not exist or is not accessible`
    };
  }

  return { valid: true };
}
