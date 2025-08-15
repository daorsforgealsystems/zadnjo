import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '../ProfilePage';
import { AuthProvider } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { username: 'testuser', website: 'test.com', avatar_url: 'test.png' }, error: null, status: 200 }),
        })),
      })),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('ProfilePage', () => {
  it('renders the profile page and allows updating the profile', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('testuser');
    });

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'newuser' } });
    fireEvent.click(screen.getByText(/update/i));

    await waitFor(() => {
      expect(supabase.from('profiles').upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
        })
      );
    });
  });
});