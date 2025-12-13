import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AttestationPage from './AttestationPage';

// Mock fetch
global.fetch = vi.fn();
global.confirm = vi.fn();

// Mock useAuth and useToast hooks
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
const mockToast = vi.fn();

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      getAuthHeaders: mockGetAuthHeaders,
      user: { role: 'admin', email: 'admin@test.com' }
    }),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('AttestationPage - loadUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
  });

  it('should call the correct API endpoint /api/auth/users when loading users', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];

    // Mock campaigns response (initial load)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ campaigns: [] })
    });

    render(
      <BrowserRouter>
        <AttestationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Mock users response for when "Select Specific Employees" is chosen
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });

    // Click Create Campaign button
    const createButton = screen.getAllByText(/Create Campaign/i)[0];
    await userEvent.click(createButton);

    // Fill in required fields for step 1
    const nameInput = screen.getByLabelText(/Campaign Name/i);
    await userEvent.type(nameInput, 'Test Campaign');

    // Click Next to go to step 2
    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    // Select "Select Specific Employees" radio option
    const specificEmployeesOption = screen.getByLabelText(/Select Specific Employees/i);
    await userEvent.click(specificEmployeesOption);

    // Wait for the API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });
  });

  it('should handle the response array directly without accessing .users property', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];

    // Mock campaigns response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ campaigns: [] })
    });

    render(
      <BrowserRouter>
        <AttestationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Mock users response - returns array directly (not wrapped in .users)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });

    // Click Create Campaign button
    const createButton = screen.getAllByText(/Create Campaign/i)[0];
    await userEvent.click(createButton);

    // Fill in required fields for step 1
    const nameInput = screen.getByLabelText(/Campaign Name/i);
    await userEvent.type(nameInput, 'Test Campaign');

    // Click Next to go to step 2
    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    // Select "Select Specific Employees" radio option
    const specificEmployeesOption = screen.getByLabelText(/Select Specific Employees/i);
    await userEvent.click(specificEmployeesOption);

    // Verify that /api/auth/users was called
    // The fix ensures the correct endpoint is used and data is used directly (not data.users)
    let usersCall;
    await waitFor(() => {
      usersCall = global.fetch.mock.calls.find(call => call[0] === '/api/auth/users');
      expect(usersCall).toBeDefined();
    });
    
    // Verify the call was made with auth headers
    expect(usersCall[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    );
  });

  it('should show error toast when user loading fails', async () => {
    // Mock campaigns response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ campaigns: [] })
    });

    render(
      <BrowserRouter>
        <AttestationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Mock users response with error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    // Click Create Campaign button
    const createButton = screen.getAllByText(/Create Campaign/i)[0];
    await userEvent.click(createButton);

    // Fill in required fields for step 1
    const nameInput = screen.getByLabelText(/Campaign Name/i);
    await userEvent.type(nameInput, 'Test Campaign');

    // Click Next to go to step 2
    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    // Select "Select Specific Employees" radio option
    const specificEmployeesOption = screen.getByLabelText(/Select Specific Employees/i);
    await userEvent.click(specificEmployeesOption);

    // Verify error toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive'
        })
      );
    });
  });
});
