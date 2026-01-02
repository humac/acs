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
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
      });
    });

    it('renders stats cards', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Assets')).toBeInTheDocument();
        expect(screen.getByText('Team Members')).toBeInTheDocument();
        expect(screen.getByText('Partners')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('renders My Actions section with all user actions', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('My Actions')).toBeInTheDocument();
        expect(screen.getByText('View My Assets')).toBeInTheDocument();
        expect(screen.getByText('My Attestations')).toBeInTheDocument();
        expect(screen.getByText('My Profile')).toBeInTheDocument();
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
    it('navigates to assets page when clicking View My Assets', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('View My Assets')).toBeInTheDocument();
      });

      const assetsCard = screen.getByText('View My Assets').closest('.cursor-pointer');
      await user.click(assetsCard);

      expect(mockNavigate).toHaveBeenCalledWith('/assets');
    });

    it('navigates to profile page when clicking My Profile', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const profileCard = screen.getByText('My Profile').closest('.cursor-pointer');
      await user.click(profileCard);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching stats', () => {
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
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
  });
});
