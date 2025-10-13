import { render, screen } from '../../../__tests__/test-utils';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size (md)', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8 w-8 border-2');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-4 w-4 border-2');
  });

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-12 w-12 border-4');
  });

  it('has accessible name', () => {
    render(<LoadingSpinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveAccessibleName('Loading...');
  });
});
