import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from './Register';
import { AuthProvider } from '../contexts/AuthContext';

// Mock fetch
global.fetch = vi.fn();

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
    // Mock auth config fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ registration_enabled: true }),
    });
  });

  it('renders register form with default ACS logo when no branding logo exists', async () => {
    // Mock branding fetch with no logo
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logo_data: null }),
    });
    // Mock OIDC config fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: false }),
    });

    const mockSwitchToLogin = vi.fn();

    render(
      <AuthProvider>
        <Register onSwitchToLogin={mockSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ACS')).toBeInTheDocument();
    });

    expect(screen.getByText('Asset Compliance System')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
  });

  it('renders custom branding logo when available', async () => {
    const mockLogoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
    
    // Mock branding fetch with logo
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logo_data: mockLogoData }),
    });
    // Mock OIDC config fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: false }),
    });

    const mockSwitchToLogin = vi.fn();

    render(
      <AuthProvider>
        <Register onSwitchToLogin={mockSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      const logo = screen.getByAltText('Company Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', mockLogoData);
    });

    // Should NOT show default ACS text when custom logo exists
    expect(screen.queryByText('ACS')).not.toBeInTheDocument();
  });

  it('handles branding fetch error gracefully', async () => {
    // Mock branding fetch failure
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    // Mock OIDC config fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: false }),
    });

    const mockSwitchToLogin = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <Register onSwitchToLogin={mockSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ACS')).toBeInTheDocument();
    });

    // Should still show default logo on error
    expect(screen.getByText('Asset Compliance System')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch branding:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('updates form fields on user input', async () => {
    // Mock branding fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logo_data: null }),
    });
    // Mock OIDC config fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: false }),
    });

    const mockSwitchToLogin = vi.fn();
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Register onSwitchToLogin={mockSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create an account')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText('John');
    const emailInput = screen.getByPlaceholderText('you@company.com');

    await user.type(firstNameInput, 'John');
    await user.type(emailInput, 'john@example.com');

    expect(firstNameInput).toHaveValue('John');
    expect(emailInput).toHaveValue('john@example.com');
  });

  it('calls onSwitchToLogin when sign in link is clicked', async () => {
    // Mock branding fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logo_data: null }),
    });
    // Mock OIDC config fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: false }),
    });

    const mockSwitchToLogin = vi.fn();
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Register onSwitchToLogin={mockSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/sign in here/i)).toBeInTheDocument();
    });

    const signInLink = screen.getByText(/sign in here/i);
    await user.click(signInLink);

    expect(mockSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  it('handles SSO button click correctly by fetching authUrl first', async () => {
    // Mock branding fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logo_data: null }),
    });
    // Mock OIDC config fetch - enabled
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        enabled: true,
        button_text: 'Sign In with SSO',
        button_variant: 'outline',
      }),
    });

    const mockSwitchToLogin = vi.fn();
    const user = userEvent.setup();

    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    render(
      <AuthProvider>
        <Register onSwitchToLogin={mockSwitchToLogin} />
      </AuthProvider>
    );

    // Wait for the SSO button to appear
    await waitFor(() => {
      expect(screen.getByText('Sign In with SSO')).toBeInTheDocument();
    });

    // Mock the OIDC login endpoint fetch
    const mockAuthUrl = 'https://sso.example.com/authorize?state=abc123';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authUrl: mockAuthUrl,
        state: 'abc123',
      }),
    });

    const ssoButton = screen.getByText('Sign In with SSO').closest('button');
    await user.click(ssoButton);

    // Should call fetch to get authUrl
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/oidc/login');
    });

    // Should redirect to authUrl
    await waitFor(() => {
      expect(window.location.href).toBe(mockAuthUrl);
    });
  });

  it('shows error if SSO login fetch fails', async () => {
    // Mock branding fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logo_data: null }),
    });
    // Mock OIDC config fetch - enabled
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        enabled: true,
        button_text: 'Sign In with SSO',
        button_variant: 'outline',
      }),
    });

    const mockSwitchToLogin = vi.fn();
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Register onSwitchToLogin={mockSwitchToLogin} />
      </AuthProvider>
    );

    // Wait for the SSO button to appear
    await waitFor(() => {
      expect(screen.getByText('Sign In with SSO')).toBeInTheDocument();
    });

    // Mock the OIDC login endpoint fetch to fail
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'OIDC is not configured',
      }),
    });

    const ssoButton = screen.getByText('Sign In with SSO').closest('button');
    await user.click(ssoButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/OIDC is not configured/i)).toBeInTheDocument();
    });
  });
});
