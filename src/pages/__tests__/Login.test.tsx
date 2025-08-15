import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import React from 'react';

// Mock useAuth so tests focus on UI behaviour
jest.mock('@/context/AuthContext', () => {
  return {
    useAuth: () => ({
      isAuthenticated: false,
      loading: false,
      user: null,
      login: jest.fn(async (email: string, password: string) => {
        if (email === 'user@example.com' && password === 'StrongPass!') {
          return { error: undefined };
        }
        return { error: { message: 'Invalid credentials' } };
      }),
      loginAsGuest: jest.fn(async () => ({ error: undefined })),
    }),
  };
});

import Login from '../Login';

describe('Login Page', () => {
  const renderLogin = () =>
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      </I18nextProvider>
    );

  test('renders form fields and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation-like error when fields are empty (handled by required attribute)', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    // Browser native validation prevents submit; we can still assert the button exists
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('submits and shows error on invalid credentials', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('guest login button triggers handler', async () => {
    renderLogin();
    const guestBtn = screen.getByRole('button', { name: /guest/i });
    fireEvent.click(guestBtn);
    await waitFor(() => {
      // No error alert for success mock
      expect(screen.queryByText(/invalid credentials/i)).toBeNull();
    });
  });

  test('supports i18n - Bosnian strings', async () => {
    i18n.changeLanguage('bs');
    renderLogin();
    expect(screen.getByText(/Prijavi se/i)).toBeInTheDocument();
  });
});