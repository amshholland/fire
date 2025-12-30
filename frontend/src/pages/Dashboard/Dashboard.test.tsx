import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard.tsx';

test('renders Dashboard heading', () => {
  render(<Dashboard />);
  const headingElement = screen.getByText(/Welcome to the Dashboard/i);
  expect(headingElement).toBeInTheDocument() 
});