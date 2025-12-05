import { render, screen } from '@testing-library/react';
import Header from './Header.tsx';

test('renders Header heading', () => {
  render(<Header />);
  const headingElement = screen.getByText(/Welcome to the Header/i);
  expect(headingElement).toBeInTheDocument();
});