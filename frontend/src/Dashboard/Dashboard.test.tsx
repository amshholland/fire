import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard.tsx';

test('renders Home Screen heading', () => {
  render(<Dashboard />);
  const headingElement = screen.getByText(/Welcome to the Home Screen/i);
  expect(headingElement).toBeInTheDocument();
});