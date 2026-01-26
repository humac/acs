import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { AuthProvider } from '../contexts/AuthContext';

// Mock fetch
global.fetch = vi.fn();

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
    // Mock OIDC config check
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: false }),
    });
    // Mock passkey config check
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: true }),
    });
    // Mock auth config
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ registration_enabled: true, password_login_enabled: true }),
    });
    // Mock branding fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        logo_data: null,
        site_name: 'ACS',
        sub_title: 'Asset Compliance System',
        primary_color: '#3B82F6',
        favicon_data: null
      }),
    });
  });

  it('renders login form', async () => {
    const mockSwitchToRegister = vi.fn();

    render(
      <AuthProvider>
        <Login onSwitchToRegister={mockSwitchToRegister} />
      </AuthProvider>
    );

    await waitFor(() => {
      const acsElements = screen.getAllByText('ACS');
      expect(acsElements.length).toBeGreaterThan(0);
    });

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use passkey/i })).toBeInTheDocument();
  });

  it('updates form fields on user input', async () => {
    const mockSwitchToRegister = vi.fn();
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Login onSwitchToRegister={mockSwitchToRegister} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls onSwitchToRegister when register link is clicked', async () => {
    const mockSwitchToRegister = vi.fn();
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Login onSwitchToRegister={mockSwitchToRegister} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/register here/i)).toBeInTheDocument();
    });

    const registerLink = screen.getByText(/register here/i);
    await user.click(registerLink);

    expect(mockSwitchToRegister).toHaveBeenCalledTimes(1);
  });
});
