import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FMCG EDA Dashboard', () => {
  render(<App />);
  const linkElement = screen.getByText(/FMCG EDA Dashboard/i);
  expect(linkElement).toBeInTheDocument();
});
