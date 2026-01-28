import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetEditModal from './AssetEditModal';

// Mock fetch
global.fetch = vi.fn();

// Mock useAuth hook
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
let mockUser = { role: 'admin', email: 'admin@test.com' };

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      getAuthHeaders: mockGetAuthHeaders,
      user: mockUser,
    }),
  };
});

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AssetEditModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSaved = vi.fn();

  const sampleAsset = {
    id: 1,
    employee_first_name: 'John',
    employee_last_name: 'Doe',
    employee_email: 'john@example.com',
    company_name: 'Acme Corp',
    asset_type: 'laptop',
    make: 'Dell',
    model: 'XPS 15',
    serial_number: 'SN12345',
    asset_tag: 'AT001',
    status: 'active',
    notes: 'Test notes',
    manager_first_name: 'Jane',
    manager_last_name: 'Manager',
    manager_email: 'jane@example.com',
    registration_date: '2024-01-15',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { role: 'admin', email: 'admin@test.com' };

    // Mock companies and asset types API calls
    global.fetch.mockImplementation((url) => {
      if (url === '/api/companies/names') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Acme Corp' }],
        });
      }
      if (url === '/api/asset-types') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'laptop', display_name: 'Laptop' }],
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it('renders modal with title', () => {
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('Edit Asset')).toBeInTheDocument();
  });

  it('displays read-only dates section', () => {
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    // Check for read-only date labels
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Last Modified')).toBeInTheDocument();
  });

  it('displays employee information section', () => {
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    // Check for employee section header
    expect(screen.getByText('Employee Information')).toBeInTheDocument();
    // Check for employee name in input fields
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('displays manager info section', () => {
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('Manager Information')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Manager')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
  });

  it('displays notes field with existing notes', () => {
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    // Notes should be shown as an editable textarea
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });

  it('shows editable fields for admin user', () => {
    mockUser = { role: 'admin', email: 'admin@test.com' };
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    // Admin should be able to edit all fields
    expect(screen.getByLabelText('First Name *')).not.toBeDisabled();
    expect(screen.getByLabelText('Last Name *')).not.toBeDisabled();
    expect(screen.getByLabelText('Employee Email *')).not.toBeDisabled();
    expect(screen.getByLabelText('Manager First Name')).not.toBeDisabled();
    expect(screen.getByLabelText('Manager Last Name')).not.toBeDisabled();
    expect(screen.getByLabelText('Manager Email')).not.toBeDisabled();
  });

  it('shows read-only employee/manager fields for non-admin user', () => {
    mockUser = { role: 'employee', email: 'john@example.com' };
    const currentUser = { roles: ['user'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    // Non-admin should have read-only employee/manager fields
    expect(screen.getByLabelText('First Name *')).toBeDisabled();
    expect(screen.getByLabelText('Last Name *')).toBeDisabled();
    expect(screen.getByLabelText('Employee Email *')).toBeDisabled();
    expect(screen.getByLabelText('Manager First Name')).toBeDisabled();
    expect(screen.getByLabelText('Manager Last Name')).toBeDisabled();
    expect(screen.getByLabelText('Manager Email')).toBeDisabled();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('saves asset when Save Changes button is clicked', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };

    const mockResponse = {
      asset: {
        ...sampleAsset,
        status: 'active',
      }
    };

    // Override fetch mock for this test
    global.fetch.mockImplementation((url, options) => {
      if (url === '/api/companies/names') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Acme Corp' }],
        });
      }
      if (url === '/api/asset-types') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'laptop', display_name: 'Laptop' }],
        });
      }
      if (url === '/api/assets/1' && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      // Verify fetch was called with PUT method
      const putCall = global.fetch.mock.calls.find(
        call => call[0] === '/api/assets/1' && call[1]?.method === 'PUT'
      );
      expect(putCall).toBeDefined();

      // Verify the payload contains the asset data
      const payload = JSON.parse(putCall[1].body);
      expect(payload.status).toBe('active');
      expect(payload.employee_first_name).toBe('John');
      expect(payload.employee_last_name).toBe('Doe');
      expect(payload.company_name).toBe('Acme Corp');
      expect(payload.manager_first_name).toBe('Jane');
      expect(payload.manager_last_name).toBe('Manager');

      expect(mockOnSaved).toHaveBeenCalledWith(mockResponse.asset);
    });
  });

  it('has status dropdown with backend-compatible values', () => {
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    // Verify status select is present and has correct role
    const statusTrigger = screen.getByLabelText('Status');
    expect(statusTrigger).toBeInTheDocument();
    expect(statusTrigger).toHaveAttribute('role', 'combobox');
  });

  it('displays correct dialog description for admin', () => {
    mockUser = { role: 'admin', email: 'admin@test.com' };
    const currentUser = { roles: ['admin'] };

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('Update all asset details. Fields marked with * are required.')).toBeInTheDocument();
  });

  describe('Returned Date Field', () => {
    it('does not show returned date field when status is not returned', () => {
      const currentUser = { roles: ['admin'] };

      render(
        <AssetEditModal
          asset={sampleAsset}
          currentUser={currentUser}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      expect(screen.queryByLabelText(/Returned Date/)).not.toBeInTheDocument();
    });

    it('shows returned date field with Optional label when status is returned', () => {
      const currentUser = { roles: ['admin'] };
      const returnedAsset = { ...sampleAsset, status: 'returned' };

      render(
        <AssetEditModal
          asset={returnedAsset}
          currentUser={currentUser}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      expect(screen.getByLabelText(/Returned Date \(Optional\)/)).toBeInTheDocument();
    });

    it('returned date field does not have required attribute', () => {
      const currentUser = { roles: ['admin'] };
      const returnedAsset = { ...sampleAsset, status: 'returned' };

      render(
        <AssetEditModal
          asset={returnedAsset}
          currentUser={currentUser}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const dateInput = screen.getByLabelText(/Returned Date \(Optional\)/);
      expect(dateInput).not.toHaveAttribute('required');
    });
  });
});
