import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';

let mockUserRole = 'employee';
let mockPendingCount = 0;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: mockUserRole,
    },
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-pending-attestations', () => ({
  usePendingAttestations: () => ({
    pendingCount: mockPendingCount,
    loading: false,
    refresh: vi.fn(),
  }),
}));

const renderLayout = (initialPath = '/') => {
  const setTheme = vi.fn();
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<Layout theme="light" setTheme={setTheme} />}>
          <Route path="/" element={<div />} />
          <Route path="/my-attestations" element={<div />} />
          <Route path="/attestation" element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('Layout navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRole = 'employee';
    mockPendingCount = 0;
  });

  it('shows My Attestations for all roles and hides Campaigns for employees', () => {
    mockUserRole = 'employee';
    renderLayout();

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('My Attestations')).toBeInTheDocument();
    expect(screen.queryByText('Campaigns')).not.toBeInTheDocument();
    expect(screen.queryByText('Management')).not.toBeInTheDocument();
  });

  it('shows Campaigns and Management section for privileged roles', () => {
    mockUserRole = 'manager';
    renderLayout();

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('My Attestations')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
  });

  it('shows pending badge on My Attestations when count is non-zero', () => {
    mockUserRole = 'employee';
    mockPendingCount = 4;
    renderLayout();

    const myAttestationsItem = screen.getByText('My Attestations').closest('button');
    expect(myAttestationsItem).not.toBeNull();
    expect(within(myAttestationsItem).getByText('4')).toBeInTheDocument();
  });
});
