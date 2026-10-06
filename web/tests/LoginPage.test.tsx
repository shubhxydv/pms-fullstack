import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../src/pages/LoginPage';
import { AuthProvider } from '../src/features/auth/AuthContext';
import * as authApi from '../src/features/auth/api';

vi.mock('../src/features/auth/api');

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('shows validation errors when submitting an empty form', async () => {
    vi.mocked(authApi.silentRefresh).mockResolvedValue(null);
    renderLoginPage();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('shows the API error message when login fails', async () => {
    vi.mocked(authApi.silentRefresh).mockResolvedValue(null);
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password' } } },
    });
    renderLoginPage();

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'WrongPassword1');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('calls login with the entered credentials on valid submit', async () => {
    vi.mocked(authApi.silentRefresh).mockResolvedValue(null);
    vi.mocked(authApi.login).mockResolvedValue({
      id: '1',
      fullName: 'Alice',
      email: 'alice@example.com',
      role: 'USER',
      createdAt: new Date().toISOString(),
    });
    renderLoginPage();

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: 'Password123',
      });
    });
  });
});
