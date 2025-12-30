import { render } from '@testing-library/react'
import Dashboard from './Dashboard.tsx'

// Mock the child components to avoid their dependencies
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

test('renders Dashboard with Budget and Transactions tabs', () => {
  const { getByText, getByTestId } = render(<Dashboard />)

  // Check that tabs are rendered
  expect(getByText('Budget')).toBeInTheDocument()
  expect(getByText('Transactions')).toBeInTheDocument()

  // Check that Budget tab content is rendered (default active)
  expect(getByTestId('budget-page')).toBeInTheDocument()
  expect(getByTestId('budget-page')).toHaveTextContent('Active: true')
})
