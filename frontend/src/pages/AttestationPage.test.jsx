import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AttestationPage from './AttestationPage';

// Mock fetch
global.fetch = vi.fn();

// Mock useAuth and useToast hooks
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
const mockToast = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: mockGetAuthHeaders,
    user: { role: 'admin', email: 'admin@test.com' }
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Helper to set up default fetch mock
const setupFetchMock = (campaigns = []) => {
  global.fetch.mockImplementation((url) => {
    if (url === '/api/attestation/campaigns') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ campaigns })
      });
    }
    // Dashboard stats for any campaign
    if (url.includes('/dashboard')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ records: [] })
      });
    }
    // Default response
    return Promise.resolve({
      ok: true,
      json: async () => ([])
    });
  });
};

describe('AttestationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('shows loading state initially', () => {
      // Setup mock that returns pending promise
      global.fetch.mockImplementation(() => new Promise(() => { }));

      render(
        <BrowserRouter>
          <AttestationPage />
        </BrowserRouter>
      );

      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('calls campaigns API on mount', async () => {
      setupFetchMock();
      render(
        <BrowserRouter>
          <AttestationPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/attestation/campaigns',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token'
            })
          })
        );
      });
    });

    it('renders page after loading completes', async () => {
      setupFetchMock();
      render(
        <BrowserRouter>
          <AttestationPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Attestation Campaigns/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders campaign list when campaigns exist', async () => {
      const mockCampaigns = [
        {
          id: 1,
          name: 'Q4 2024 Attestation',
          status: 'draft',
          target_type: 'all',
          start_date: '2024-10-01',
          end_date: '2024-12-31',
          reminder_days: 7,
          escalation_days: 10
        }
      ];
      setupFetchMock(mockCampaigns);

      render(
        <BrowserRouter>
          <AttestationPage />
        </BrowserRouter>
      );

      // Wait for loading to complete and page title to render
      await waitFor(() => {
        expect(screen.getByText(/Attestation Campaigns \(1\)/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check for table headers
      expect(screen.getByText('Campaign Name / Description')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      // Status might appear in filters too, so check specifically for column header or valid instance
      const statusHeaders = screen.getAllByText('Status');
      expect(statusHeaders.length).toBeGreaterThan(0);

      // Check for campaign data in table row
      expect(screen.getByText('Q4 2024 Attestation')).toBeInTheDocument();
      expect(screen.getByText(/draft/i)).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(2); // Header + Row checkbox
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when campaigns fail to load', async () => {
      global.fetch.mockImplementation(() => Promise.resolve({
        ok: false,
        status: 500
      }));

      render(
        <BrowserRouter>
          <AttestationPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: 'Failed to load attestation campaigns',
            variant: 'destructive'
          })
        );
      }, { timeout: 3000 });
    });
  });
});
