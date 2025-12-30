import { render, screen, waitFor } from '@testing-library/react'
import Transactions from './Transactions'

// Mock fetch globally
global.fetch = jest.fn()

const mockCategories = [
  { id: 1, name: 'Groceries', type: 'expense' },
  { id: 2, name: 'Dining Out', type: 'expense' },
  { id: 3, name: 'Transportation', type: 'expense' }
]

describe('Transactions Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/transactions/db')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            transactions: [],
            total_count: 0,
            page: 1,
            page_size: 50
          })
        })
      }
      if (
        url.includes('/api/categories') ||
        url.includes('/api/debug/categories')
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ categories: mockCategories })
        })
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`))
    })
  })

  it('should render transactions table', async () => {
    render(<Transactions />)

    await waitFor(
      () => {
        expect(screen.getByText(/Transactions/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should display error when API returns non-OK response', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/transactions/db')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      }
      if (
        url.includes('/api/categories') ||
        url.includes('/api/debug/categories')
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ categories: mockCategories })
        })
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`))
    })

    render(<Transactions />)

    await waitFor(
      () => {
        expect(
          screen.getByText(/Failed to load transactions/i)
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })
})
