import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock child components to avoid their complexity
vi.mock('./OIDCSettings', () => ({ default: () => <div data-testid="oidc-settings">OIDC</div> }));
vi.mock('./HubSpotSettings', () => ({ default: () => <div data-testid="hubspot-settings">HubSpot</div> }));
vi.mock('./AssetTypesSettings', () => ({ default: () => <div data-testid="asset-types-settings">Asset Types</div> }));
vi.mock('./EmailTemplates', () => ({ default: () => <div data-testid="email-templates">Email Templates</div> }));

// Mock new admin components
vi.mock('./admin/SettingsLayout', () => ({ 
  default: ({ children, activeSection, onSectionChange }) => (
    <div data-testid="settings-layout">
      <div data-testid="active-section">{activeSection}</div>
      {children}
    </div>
  )
}));
vi.mock('./admin/RestartRequiredBanner', () => ({ default: () => <div data-testid="restart-banner">Restart Required</div> }));
vi.mock('./admin/PasskeySettings', () => ({ default: () => <div data-testid="passkey-settings">Passkey Settings</div> }));
vi.mock('./admin/SMTPSettings', () => ({ default: () => <div data-testid="smtp-settings">SMTP Settings</div> }));
vi.mock('./admin/ProxySettings', () => ({ default: () => <div data-testid="proxy-settings">Proxy Settings</div> }));
vi.mock('./admin/RateLimitingSettings', () => ({ default: () => <div data-testid="rate-limiting-settings">Rate Limiting</div> }));

// Variable to control user role
let mockUserRole = 'admin';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@test.com', role: mockUserRole },
    getAuthHeaders: () => ({ Authorization: 'Bearer token' }),
  }),
}));

// Mock fetch
global.fetch = vi.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({
    logo_data: null,
    site_name: 'ACS',
    sub_title: 'Test Subtitle',
    primary_color: '#3B82F6',
  }),
}));

import AdminSettings from './AdminSettings';

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <AdminSettings />
    </BrowserRouter>
  );
};

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRole = 'admin';
  });

  describe('Access Control', () => {
    it('shows access denied for employee role', () => {
      mockUserRole = 'employee';
      renderSettings();
      expect(screen.getByText(/Access Denied/)).toBeInTheDocument();
    });

    it('shows access denied for manager role', () => {
      mockUserRole = 'manager';
      renderSettings();
      expect(screen.getByText(/Access Denied/)).toBeInTheDocument();
    });

    it('shows access denied for coordinator role', () => {
      mockUserRole = 'coordinator';
      renderSettings();
      expect(screen.getByText(/Access Denied/)).toBeInTheDocument();
    });

    it('shows settings for admin role', () => {
      mockUserRole = 'admin';
      renderSettings();
      expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockUserRole = 'admin';
    });

    it('renders sidebar layout', () => {
      renderSettings();
      expect(screen.getByTestId('settings-layout')).toBeInTheDocument();
    });

    it('shows branding section by default', () => {
      renderSettings();
      expect(screen.getByTestId('active-section')).toHaveTextContent('branding');
    });

    it('shows Admin Settings header', () => {
      renderSettings();
      expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    });
  });

  describe('Branding Section (default)', () => {
    beforeEach(() => {
      mockUserRole = 'admin';
    });

    it('shows Company Logo section', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByText('Company Logo')).toBeInTheDocument();
      });
    });

    it('shows Site Name field', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByLabelText('Site Name')).toBeInTheDocument();
      });
    });

    it('shows Subtitle field', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByLabelText('Subtitle')).toBeInTheDocument();
      });
    });

    it('shows Favicon section', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByText('Favicon')).toBeInTheDocument();
      });
    });

    it('shows Primary Brand Color field', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByText('Primary Brand Color')).toBeInTheDocument();
      });
    });

    it('shows App URL field', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByLabelText('App URL')).toBeInTheDocument();
      });
    });

    it('shows Footer Label field', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByLabelText('Footer Label')).toBeInTheDocument();
      });
    });

    it('shows Save Changes button', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      });
    });

    it('shows Choose Image button for logo', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Choose Image' })).toBeInTheDocument();
      });
    });

    it('shows Choose Favicon button', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Choose Favicon' })).toBeInTheDocument();
      });
    });

    it('shows email logo toggle', async () => {
      renderSettings();
      await waitFor(() => {
        expect(screen.getByText('Include logo in email headers')).toBeInTheDocument();
      });
    });
  });

  describe('Fetches branding settings', () => {
    beforeEach(() => {
      mockUserRole = 'admin';
    });

    it('calls branding API on mount', async () => {
      renderSettings();
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/branding');
      });
    });

    it('populates site name from API response', async () => {
      renderSettings();
      await waitFor(() => {
        const input = screen.getByLabelText('Site Name');
        expect(input).toHaveValue('ACS');
      });
    });
  });
});
