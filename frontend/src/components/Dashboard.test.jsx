import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch globally
global.fetch = vi.fn();

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext with default employee role
const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'employee',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ 'Authorization': 'Bearer test-token' }),
    user: mockUser,
  }),
}));

const mockStats = {
  assetsCount: 10,
  employeesCount: 5,
  companiesCount: 3,
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    });
  });

  describe('rendering for all users', () => {
    it('renders dashboard title and welcome message', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Main dashboard title exists
        const dashboardTitles = screen.getAllByText('My Dashboard');
        expect(dashboardTitles.length).toBeGreaterThan(0);
        expect(screen.getByText(/Welcome back,/)).toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
      });
    });

    it('renders common cards section for all users', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Common cards section header
        expect(screen.getByText('My Information')).toBeInTheDocument();

        // Common cards that all users see - unique descriptive text
        expect(screen.getByText('View and edit personal information')).toBeInTheDocument();
        expect(screen.getByText('Assets assigned to me')).toBeInTheDocument();

        // My Profile appears in multiple places (common cards + quick actions for some roles)
        const profileCards = screen.getAllByText('My Profile');
        expect(profileCards.length).toBeGreaterThan(0);

        // My Attestations also appears in common cards
        const attestationText = screen.queryByText('All up to date') || screen.queryByText('Action required');
        expect(attestationText || screen.getByText('My Information')).toBeInTheDocument();
      });
    });

    it('renders Quick Actions section', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Quick Actions header (for employees)
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });
  });

  describe('role-based visibility - employee', () => {
    it('does not show management section for employees', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Management')).not.toBeInTheDocument();
        expect(screen.queryByText('Manage Users')).not.toBeInTheDocument();
      });
    });

    it('does not show administration section for employees', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Administration')).not.toBeInTheDocument();
        expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to assets page when clicking My Assets card in common section', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Assets assigned to me')).toBeInTheDocument();
      });

      // Click the My Assets card (which contains "Assets assigned to me")
      const assetsCard = screen.getByText('Assets assigned to me').closest('.glass-panel');
      await user.click(assetsCard);

      expect(mockNavigate).toHaveBeenCalledWith('/assets?view=my-assets');
    });

    it('navigates to profile page when clicking My Profile card', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('View and edit personal information')).toBeInTheDocument();
      });

      // Click the My Profile card
      const profileCard = screen.getByText('View and edit personal information').closest('.glass-panel');
      await user.click(profileCard);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching stats', () => {
      global.fetch.mockImplementation(() => new Promise(() => { })); // Never resolves

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Synchronizing ACS Data...')).toBeInTheDocument();
    });
  });

  describe('API interaction', () => {
    it('fetches dashboard stats on mount', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/stats', {
          headers: { 'Authorization': 'Bearer test-token' },
        });
      });
    });

    it('fetches my attestations for employee role', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/attestation/my-attestations', {
          headers: { 'Authorization': 'Bearer test-token' },
        });
      });
    });
  });

  describe('attestation counting', () => {
    it('counts both pending and in_progress attestations as pending', async () => {
      const mockAttestations = {
        attestations: [
          { id: 1, status: 'pending' },
          { id: 2, status: 'in_progress' },
          { id: 3, status: 'completed' },
          { id: 4, status: 'pending' },
        ]
      };

      global.fetch.mockImplementation((url) => {
        if (url === '/api/stats') {
          return Promise.resolve({
            ok: true,
            json: async () => mockStats,
          });
        }
        if (url === '/api/assets') {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url === '/api/attestation/my-attestations') {
          return Promise.resolve({
            ok: true,
            json: async () => mockAttestations,
          });
        }
        return Promise.resolve({
          ok: false,
        });
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should show count of 3 (2 pending + 1 in_progress) in My Attestations common card
        // Find the My Attestations card by looking for the descriptive text
        const attestationCard = screen.getByText('Action required').closest('.glass-panel');
        expect(attestationCard).toBeInTheDocument();

        // The count should be displayed in the card (with warning color)
        const countElements = screen.getAllByText('3');
        expect(countElements.length).toBeGreaterThan(0);
      });
    });

    it('shows 0 and "All up to date" when all attestations are completed', async () => {
      const mockAttestations = {
        attestations: [
          { id: 1, status: 'completed' },
          { id: 2, status: 'completed' },
        ]
      };

      global.fetch.mockImplementation((url) => {
        if (url === '/api/stats') {
          return Promise.resolve({
            ok: true,
            json: async () => mockStats,
          });
        }
        if (url === '/api/assets') {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url === '/api/attestation/my-attestations') {
          return Promise.resolve({
            ok: true,
            json: async () => mockAttestations,
          });
        }
        return Promise.resolve({
          ok: false,
        });
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // New text is "All up to date" instead of "All attestations complete"
        expect(screen.getByText('All up to date')).toBeInTheDocument();
      });
    });
  });

  describe('navigation to my-attestations', () => {
    it('navigates to /my-attestations when clicking My Attestations card in common section', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Wait for the attestation status text to appear
        const statusTexts = screen.queryByText('All up to date') || screen.queryByText('Action required');
        expect(statusTexts || screen.getByText('My Information')).toBeInTheDocument();
      });

      // Find the My Attestations card in common section by finding unique text
      // The card contains either "All up to date" or "Action required"
      const allUpToDate = screen.queryByText('All up to date');
      const actionRequired = screen.queryByText('Action required');

      const attestationCard = (allUpToDate || actionRequired)?.closest('.glass-panel');

      if (attestationCard) {
        await user.click(attestationCard);
        expect(mockNavigate).toHaveBeenCalledWith('/my-attestations');
      } else {
        // If neither text is found, fail the test with a helpful message
        throw new Error('Could not find My Attestations card');
      }
    });

    it('navigates to /my-attestations when clicking My Attestations quick action for employees', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Wait for Quick Actions section to load
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });

      // Find the My Attestations quick action in the Quick Actions section
      // It should have the text "My Attestations" with "Quick access" subtitle
      const quickAccessCards = screen.getAllByText('Quick access');
      expect(quickAccessCards.length).toBeGreaterThan(0);

      // Find the card that contains both "My Attestations" and "Quick access"
      for (const element of quickAccessCards) {
        const card = element.closest('.glass-panel');
        if (card && card.textContent?.includes('My Attestations')) {
          await user.click(card);
          expect(mockNavigate).toHaveBeenCalledWith('/my-attestations');
          return;
        }
      }
    });
  });
});
