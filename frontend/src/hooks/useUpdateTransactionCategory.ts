/**
 * useUpdateTransactionCategory Hook
 * 
 * Custom hook for updating transaction categories.
 * Provides loading state and user feedback via messages.
 */

import { useState } from 'react';
import { message } from 'antd';

interface UpdateCategoryParams {
  transactionId: string;
  categoryId: number;
  userId: string;
}

interface UpdateCategoryResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for updating transaction category
 * 
 * Usage:
 *   const { updateCategory, loading } = useUpdateTransactionCategory();
 *   await updateCategory({ transactionId: 'txn-123', categoryId: 5, userId: 'user-123' });
 * 
 * @returns Object with updateCategory function and loading state
 */
export function useUpdateTransactionCategory() {
  const [loading, setLoading] = useState(false);

  const updateCategory = async (params: UpdateCategoryParams): Promise<UpdateCategoryResult> => {
    const { transactionId, categoryId, userId } = params;

    setLoading(true);

    try {
      const response = await fetch(`/api/transactions/${transactionId}/category`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category_id: categoryId,
          userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Failed to update transaction category');
        return {
          success: false,
          error: data.error
        };
      }

      message.success('Transaction category updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating transaction category:', error);
      message.error('Network error: Failed to update category');
      return {
        success: false,
        error: 'Network error'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateCategory,
    loading
  };
}
