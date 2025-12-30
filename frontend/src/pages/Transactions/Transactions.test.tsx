import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Transactions from './Transactions'

// Mock the fetch API
global.fetch = jest.fn()

// Mock CategorySelector to avoid complex Ant Design Select testing
jest.mock('../../components/CategorySelector/CategorySelector', () => {
  return function MockCategorySelector({ currentCategoryName }: any) {
    return <div data-testid="category-selector">{currentCategoryName || 'Uncategorized'}</div>
  }
})

// Mock Ant Design Table to avoid matchMedia issues in tests
jest.mock('antd', () => {
  const actual = jest.requireActual('antd')
  return {
    ...actual,
    Table: ({ dataSource, columns, rowKey, pagination }: any) => (
      <div data-testid="transactions-table">
        <table>
          <thead>
            <tr>
              {columns.map((col: any) => (
                <th key={col.key}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataSource && dataSource.length > 0
              ? dataSource.map((row: any) => (
                  <tr key={row[rowKey]}>
                    {columns.map((col: any) => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(row[col.dataIndex], row)
                          : row[col.dataIndex]}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
        {pagination && pagination.showTotal && (
          <div>{pagination.showTotal(dataSource?.length || 0)}</div>
        )}
      </div>
    )
  }
})

describe('Transactions Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<Transactions />)

    // Check for loading indicator by checking the Spin component is present
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument()
    const spinElement = document.querySelector('.ant-spin-spinning')
    expect(spinElement).toBeInTheDocument()
  })

  it('should render transactions table when data loads', async () => {
    const mockTransactions = [
      {
        transaction_id: 'txn-1',
        date: '2025-01-15',
        merchant_name: 'Whole Foods',
        amount: -85.5,
        app_category_id: 1,
        app_category_name: 'Groceries',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Checking'
      },
      {
        transaction_id: 'txn-2',
        date: '2025-01-14',
        merchant_name: 'Shell Gas',
        amount: -45.0,
        app_category_id: 2,
        app_category_name: 'Transportation',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Credit Card'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: mockTransactions })
    })

    render(<Transactions />)

    await waitFor(() => {
      expect(screen.getByText('Whole Foods')).toBeInTheDocument()
      expect(screen.getByText('Shell Gas')).toBeInTheDocument()
    })
  })

  it('should display all required columns', async () => {
    const mockTransaction = {
      transaction_id: 'txn-1',
      date: '2025-01-15',
      merchant_name: 'Target',
      amount: -125.0,
      app_category_id: 1,
      app_category_name: 'Shopping',
      plaid_category_primary: null,
      plaid_category_detailed: null,
      account_name: 'Checking Account'
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: [mockTransaction] })
    })

    render(<Transactions />)

    await waitFor(() => {
      // Verify all column headers exist
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Merchant')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Account')).toBeInTheDocument()

      // Verify data is displayed
      expect(screen.getByText('Target')).toBeInTheDocument()
      expect(screen.getByText('Shopping')).toBeInTheDocument()
      expect(screen.getByText('Checking Account')).toBeInTheDocument()
    })
  })

  it('should handle empty state gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: [] })
    })

    render(<Transactions />)

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument()
    })
  })

  it('should handle error state gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    render(<Transactions />)

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load transactions/i)
      ).toBeInTheDocument()
    })
  })

  it('should display uncategorized transactions', async () => {
    const uncategorizedTransaction = {
      transaction_id: 'txn-uncategorized',
      date: '2025-01-15',
      merchant_name: 'Unknown Store',
      amount: -25.0,
      app_category_id: null,
      app_category_name: null,
      plaid_category_primary: null,
      plaid_category_detailed: null,
      account_name: 'Checking'
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: [uncategorizedTransaction] })
    })

    render(<Transactions />)

    await waitFor(() => {
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    })
  })

  it('should format currency correctly', async () => {
    const transactions = [
      {
        transaction_id: 'txn-expense',
        date: '2025-01-15',
        merchant_name: 'Store',
        amount: -50.0,
        app_category_id: 1,
        app_category_name: 'Shopping',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Checking'
      },
      {
        transaction_id: 'txn-income',
        date: '2025-01-14',
        merchant_name: 'Refund',
        amount: 25.5,
        app_category_id: null,
        app_category_name: null,
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Checking'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions })
    })

    render(<Transactions />)

    await waitFor(() => {
      expect(screen.getByText('-$50.00')).toBeInTheDocument()
      expect(screen.getByText('$25.50')).toBeInTheDocument()
    })
  })

  it('should render category selector for each transaction', async () => {
    const mockTransactions = [
      {
        transaction_id: 'txn-1',
        date: '2025-01-15',
        merchant_name: 'Whole Foods',
        amount: -85.5,
        app_category_id: 1,
        app_category_name: 'Groceries',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Checking'
      },
      {
        transaction_id: 'txn-2',
        date: '2025-01-14',
        merchant_name: 'Shell Gas',
        amount: -45.0,
        app_category_id: 2,
        app_category_name: 'Transportation',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Credit Card'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: mockTransactions })
    })

    render(<Transactions />)

    await waitFor(() => {
      const selectors = screen.getAllByTestId('category-selector')
      expect(selectors).toHaveLength(2)
      expect(selectors[0]).toHaveTextContent('Groceries')
      expect(selectors[1]).toHaveTextContent('Transportation')
    })
  })

  it('should display Uncategorized in selector for null category', async () => {
    const uncategorizedTransaction = {
      transaction_id: 'txn-uncategorized',
      date: '2025-01-15',
      merchant_name: 'Unknown Store',
      amount: -25.0,
      app_category_id: null,
      app_category_name: null,
      plaid_category_primary: null,
      plaid_category_detailed: null,
      account_name: 'Checking'
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: [uncategorizedTransaction] })
    })

    render(<Transactions />)

    await waitFor(() => {
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    })
  })
})

