import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingPage from '../LandingPage';
import { MemoryRouter } from 'react-router-dom';

describe('LandingPage', () => {
  it('renders hero title', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeTruthy();
  });

  it('has skip link for accessibility', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toBeInTheDocument();
  });
});
