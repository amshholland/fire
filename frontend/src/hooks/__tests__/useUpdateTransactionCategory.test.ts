/**
 * useUpdateTransactionCategory Hook Tests
 * 
 * Tests the custom hook for updating transaction categories.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateTransactionCategory } from '../useUpdateTransactionCategory';
import { message } from 'antd';

jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('useUpdateTransactionCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should successfully update transaction category', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Transaction category updated successfully'
      })
    });

    const { result } = renderHook(() => useUpdateTransactionCategory());

    let updateResult: any;
    await act(async () => {
      updateResult = await result.current.updateCategory({
        transactionId: 'txn-123',
        categoryId: 5,
        userId: 'user-123'
      });
    });

    expect(updateResult.success).toBe(true);
    expect(message.success).toHaveBeenCalledWith('Transaction category updated successfully');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions/txn-123/category',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category_id: 5, userId: 'user-123' })
      })
    );
  });

  it('should handle API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Transaction not found'
      })
    });

    const { result } = renderHook(() => useUpdateTransactionCategory());

    let updateResult: any;
    await act(async () => {
      updateResult = await result.current.updateCategory({
        transactionId: 'txn-invalid',
        categoryId: 1,
        userId: 'user-123'
      });
    });

    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toBe('Transaction not found');
    expect(message.error).toHaveBeenCalledWith('Transaction not found');
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUpdateTransactionCategory());

    let updateResult: any;
    await act(async () => {
      updateResult = await result.current.updateCategory({
        transactionId: 'txn-123',
        categoryId: 1,
        userId: 'user-123'
      });
    });

    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toBe('Network error');
    expect(message.error).toHaveBeenCalledWith('Network error: Failed to update category');
  });

  it('should set loading state correctly during update', async () => {
    let resolvePromise: any;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

    const { result } = renderHook(() => useUpdateTransactionCategory());

    expect(result.current.loading).toBe(false);

    // Start update
    let updatePromise: Promise<any>;
    act(() => {
      updatePromise = result.current.updateCategory({
        transactionId: 'txn-123',
        categoryId: 1,
        userId: 'user-123'
      });
    });

    // Should be loading
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve fetch
    act(() => {
      resolvePromise({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    await updatePromise!;

    // Should no longer be loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should reset loading state even on error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUpdateTransactionCategory());

    await act(async () => {
      await result.current.updateCategory({
        transactionId: 'txn-123',
        categoryId: 1,
        userId: 'user-123'
      });
    });

    expect(result.current.loading).toBe(false);
  });

  it('should handle 404 error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Transaction not found or does not belong to user'
      })
    });

    const { result } = renderHook(() => useUpdateTransactionCategory());

    let updateResult: any;
    await act(async () => {
      updateResult = await result.current.updateCategory({
        transactionId: 'txn-nonexistent',
        categoryId: 1,
        userId: 'user-123'
      });
    });

    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toContain('not found');
    expect(message.error).toHaveBeenCalled();
  });

  it('should handle validation error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Invalid category_id: must be a positive integer'
      })
    });

    const { result } = renderHook(() => useUpdateTransactionCategory());

    let updateResult: any;
    await act(async () => {
      updateResult = await result.current.updateCategory({
        transactionId: 'txn-123',
        categoryId: -1,
        userId: 'user-123'
      });
    });

    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toContain('positive integer');
    expect(message.error).toHaveBeenCalledWith('Invalid category_id: must be a positive integer');
  });

  it('should use fallback error message when error field is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    const { result } = renderHook(() => useUpdateTransactionCategory());

    await act(async () => {
      await result.current.updateCategory({
        transactionId: 'txn-123',
        categoryId: 1,
        userId: 'user-123'
      });
    });

    expect(message.error).toHaveBeenCalledWith('Failed to update transaction category');
  });
});
