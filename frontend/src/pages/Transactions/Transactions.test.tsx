import { render, screen } from '@testing-library/react';
import Transactions from './Transactions.tsx';

test('renders Transactions heading', () => {
  render(<Transactions />);
  const headingElement = screen.getByText(/Welcome to the Transactions/i);
  expect(headingElement).toBeInTheDocument();
});