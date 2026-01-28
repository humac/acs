import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
        expect(screen.getByText(/My Attestations/i)).toBeInTheDocument();
      });
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
  });
});
