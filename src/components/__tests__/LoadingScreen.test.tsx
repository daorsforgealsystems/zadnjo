import { render, screen } from '@/lib/test-utils';
import LoadingScreen from '../LoadingScreen';

describe('LoadingScreen', () => {
  it('renders loading screen with correct elements', () => {
    render(<LoadingScreen />);
    
    // Check if the main heading is present
    expect(screen.getByText('DAORS Flow Motion')).toBeInTheDocument();
    
    // Check if the loading message is present
    expect(screen.getByText('Preparing your logistics platform...')).toBeInTheDocument();
    
    // Check if the truck icon is present (by checking for the svg element)
    const truckIcon = document.querySelector('svg');
    expect(truckIcon).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingScreen />);
    
    // The loading screen should be properly structured for screen readers
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('DAORS Flow Motion');
  });

  it('applies correct CSS classes for styling', () => {
  const { container } = render(<LoadingScreen />);

  // Query for the top-level layout wrapper by its utility class.
  const mainContainer = container.querySelector('.min-h-screen') as HTMLElement | null;
  expect(mainContainer).not.toBeNull();
  expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
  });
});