import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import MyAttestationsPage from './MyAttestationsPage';

// Mock fetch
global.fetch = vi.fn();

// Mock useAuth hook
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: mockGetAuthHeaders,
    user: {
      email: 'employee@test.com',
      role: 'employee',
      first_name: 'Test',
      last_name: 'User'
    }
  }),
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const renderPage = () => {
  return render(
    <BrowserRouter>
      <MyAttestationsPage />
    </BrowserRouter>
  );
};

describe('MyAttestationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for attestation records
    global.fetch.mockImplementation((url) => {
      if (url === '/api/attestation/my-attestations') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ attestations: [] })
        });
      }
      if (url === '/api/asset-types') {
        return Promise.resolve({
          ok: true,
          json: async () => ([{ id: 1, name: 'laptop', display_name: 'Laptop' }])
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ([])
      });
    });
  });

  describe('Initial Rendering', () => {
    it('renders the page title', async () => {
      renderPage();

      await waitFor(() => {
        // Use getAllByText if duplicates exist, or getByRole for better specificity
        expect(screen.getByText(/Loading your attestations.../i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading your attestations.../i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/My Attestations/i)).toBeInTheDocument();
    });

    it('calls my-attestations API on mount', async () => {
      renderPage();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/attestation/my-attestations',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token'
            })
          })
        );
      });
    });

    it('shows empty state when no attestations', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/No pending attestations/i)).toBeInTheDocument();
      });
    });

    it('renders table when attestations exist', async () => {
      global.fetch.mockImplementation((url) => {
        if (url === '/api/attestation/my-attestations') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              attestations: [
                {
                  id: 1,
                  status: 'pending',
                  campaign: {
                    name: 'Q1 Audit',
                    description: 'Q1 Asset Audit',
                    start_date: '2023-01-01',
                    end_date: '2023-01-31'
                  }
                }
              ]
            })
          });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Q1 Audit')).toBeInTheDocument();
        expect(screen.getByText('Q1 Asset Audit')).toBeInTheDocument();
        // Check for table headers
        expect(screen.getByText('Campaign')).toBeInTheDocument();
        expect(screen.getByText('Start Date')).toBeInTheDocument();
      });
    });
    it('fetches and displays assets on row expand', async () => {
      // Mock attestation records
      global.fetch.mockImplementation((url) => {
        if (url === '/api/attestation/my-attestations') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              attestations: [
                {
                  id: 99,
                  status: 'pending',
                  campaign: { name: 'Expandable Campaign', start_date: '2023-01-01' }
                }
              ]
            })
          });
        }
        if (url === '/api/attestation/records/99') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              assets: [
                { id: 1, asset_tag: 'TAG-123', asset_type: 'laptop', make: 'Dell', model: 'XPS', status: 'active' }
              ]
            })
          });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Expandable Campaign')).toBeInTheDocument();
      });

      // Find and click expand button
      // The expand button is in the first cell, so we can find it by looking for the chevron or button role
      const expandButtons = screen.getAllByRole('button');
      // The first button in the row (after filters/etc if they have buttons) should be the expand trigger.
      // A more robust way is querying within the row.
      const row = screen.getByText('Expandable Campaign').closest('tr');
      const expandBtn = within(row).getAllByRole('button')[0];

      // Click expand
      expandBtn.click();

      // Expect loading state or assets
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/attestation/records/99',
          expect.anything()
        );
        expect(screen.getByText('TAG-123')).toBeInTheDocument();
        expect(screen.getByText('Dell XPS')).toBeInTheDocument();
      });
    });

    it('prepopulates returned date from the last certification result when starting a new attestation', async () => {
      const user = userEvent.setup();

      global.fetch.mockImplementation((url) => {
        if (url === '/api/attestation/my-attestations') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              attestations: [
                {
                  id: 77,
                  status: 'pending',
                  campaign: {
                    name: 'Monthly Certification',
                    description: 'March asset review',
                    start_date: '2026-03-01',
                    end_date: '2026-03-31'
                  }
                }
              ]
            })
          });
        }

        if (url === '/api/asset-types') {
          return Promise.resolve({
            ok: true,
            json: async () => ([{ id: 1, name: 'laptop', display_name: 'Laptop' }])
          });
        }

        if (url === '/api/attestation/records/77') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              campaign: {
                id: 900,
                name: 'Monthly Certification'
              },
              assets: [
                {
                  id: 501,
                  asset_type: 'Laptop',
                  company_name: 'Acme Corp',
                  make: 'Dell',
                  model: 'Latitude',
                  serial_number: 'SN-501',
                  status: 'active',
                  returned_date: null,
                  last_certification_result: {
                    attested_status: 'returned',
                    returned_date: '2026-02-15'
                  }
                }
              ],
              attestedAssets: [],
              newAssets: []
            })
          });
        }

        if (url === '/api/attestation/records/77/assets/501') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true })
          });
        }

        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Monthly Certification')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /certify asset/i }).length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /certify asset/i })[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/attestation/records/77/assets/501',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({
              attested_status: 'returned',
              returned_date: '2026-02-15',
              notes: ''
            })
          })
        );
      });
    });

    it('renders only the eligible assets returned by the attestation details endpoint', async () => {
      const user = userEvent.setup();

      global.fetch.mockImplementation((url) => {
        if (url === '/api/attestation/my-attestations') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              attestations: [
                {
                  id: 88,
                  status: 'pending',
                  campaign: {
                    name: 'Filtered Certification',
                    description: 'Only actionable assets remain',
                    start_date: '2026-04-01',
                    end_date: '2026-04-30'
                  }
                }
              ]
            })
          });
        }

        if (url === '/api/asset-types') {
          return Promise.resolve({
            ok: true,
            json: async () => ([{ id: 1, name: 'laptop', display_name: 'Laptop' }])
          });
        }

        if (url === '/api/attestation/records/88') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              campaign: {
                id: 901,
                name: 'Filtered Certification'
              },
              assets: [
                {
                  id: 701,
                  asset_tag: 'ACTIVE-701',
                  asset_type: 'Laptop',
                  company_name: 'Acme Corp',
                  make: 'Framework',
                  model: '13',
                  serial_number: 'SN-701',
                  status: 'active'
                }
              ],
              attestedAssets: [],
              newAssets: []
            })
          });
        }

        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Filtered Certification')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      await waitFor(() => {
        expect(screen.getByText('SN-701')).toBeInTheDocument();
      });

      expect(screen.queryByText('SN-702')).not.toBeInTheDocument();
    });
  });
});
