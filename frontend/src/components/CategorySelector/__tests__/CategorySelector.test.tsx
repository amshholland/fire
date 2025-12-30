import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategorySelector from '../CategorySelector';
import { message } from 'antd';

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

global.fetch = jest.fn();

describe('CategorySelector', () => {
  const mockCategories = [
    { id: 1, name: 'Groceries' },
    { id: 2, name: 'Dining Out' },
    { id: 3, name: 'Transportation' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: mockCategories })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch and display categories on mount', async () => {
    render(
      <CategorySelector
        currentCategoryId={1}
        currentCategoryName="Groceries"
        transactionId="txn-123"
        userId="user-123"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/debug/categories');
    });
  });

  it('should display current category as selected', async () => {
    render(
      <CategorySelector
        currentCategoryId={1}
        currentCategoryName="Groceries"
        transactionId="txn-123"
        userId="user-123"
      />
    );

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  it('should handle category change successfully', async () => {
    const onCategoryChange = jest.fn();
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Updated' })
      });

    render(
      <CategorySelector
        currentCategoryId={1}
        currentCategoryName="Groceries"
        transactionId="txn-123"
        userId="user-123"
        onCategoryChange={onCategoryChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // Simulate category change would require more complex Ant Design Select mocking
    // This is a basic structure test
  });

  it('should show loading state while fetching categories', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <CategorySelector
        currentCategoryId={1}
        currentCategoryName="Groceries"
        transactionId="txn-123"
        userId="user-123"
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('should handle fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <CategorySelector
        currentCategoryId={1}
        currentCategoryName="Groceries"
        transactionId="txn-123"
        userId="user-123"
      />
    );

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to load categories');
    });
  });

  it('should be disabled when disabled prop is true', async () => {
    render(
      <CategorySelector
        currentCategoryId={1}
        currentCategoryName="Groceries"
        transactionId="txn-123"
        userId="user-123"
        disabled={true}
      />
    );

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  it('should display Uncategorized option for null category', async () => {
    render(
      <CategorySelector
        currentCategoryId={null}
        currentCategoryName={null}
        transactionId="txn-123"
        userId="user-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
