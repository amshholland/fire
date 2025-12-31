import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Dashboard from './Dashboard.tsx'

// Mock useUserAuth
jest.mock('../../hooks/useUserAuth', () => ({
  useUserAuth: () => ({
    user: { sub: 'user-123', name: 'Test User' },
    isLoggedIn: true
  })
}))

// Mock child components
jest.mock('../BudgetSetupPage/BudgetSetupPage.tsx', () => {
  return function MockBudgetSetupPage() {
    return <div data-testid="budget-setup-page">Budget Setup Page</div>
  }
})

jest.mock('../BudgetPage/BudgetPage.tsx', () => {
  return function MockBudgetPage({ isActive }: { isActive?: boolean }) {
    return (
      <div data-testid="budget-page">
        Budget Page (Active: {String(isActive)})
      </div>
    )
  }
})

jest.mock('../Transactions/Transactions.tsx', () => {
  return function MockTransactions() {
    return <div data-testid="transactions-page">Transactions Page</div>
  }
})

describe('Dashboard', () => {
  it('renders Dashboard with Budget Setup, Budget and Transactions tabs', () => {
    render(<Dashboard />)

    // Check that tab labels are rendered
    expect(screen.getByText('Budget Setup')).toBeInTheDocument()
    expect(screen.getByText('Budget')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  it('renders Budget Setup tab content by default (tab 1 is active)', () => {
    render(<Dashboard />)

    // Budget Setup is the first tab, so it should be active by default
    expect(screen.getByTestId('budget-setup-page')).toBeInTheDocument()
  })

  it('renders Budget tab when tab 2 is active', () => {
    render(<Dashboard />)

    // Click on Budget tab
    const budgetTab = screen.getByRole('tab', { name: 'Budget' })
    fireEvent.click(budgetTab)

    // Budget page should now be rendered with isActive=true
    expect(screen.getByTestId('budget-page')).toBeInTheDocument()
    expect(screen.getByTestId('budget-page')).toHaveTextContent('Active: true')
  })

  it('renders Transactions tab when tab 3 is active', () => {
    render(<Dashboard />)

    // Click on Transactions tab
    const transactionsTab = screen.getByRole('tab', { name: 'Transactions' })
    fireEvent.click(transactionsTab)

    // Transactions page should now be rendered
    expect(screen.getByTestId('transactions-page')).toBeInTheDocument()
  })
})
