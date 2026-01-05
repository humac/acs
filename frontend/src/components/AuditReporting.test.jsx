import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditReportingNew from './AuditReporting';

// Mock fetch
global.fetch = vi.fn();

// Mock useAuth hook
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
let mockUser = { id: 1, email: 'admin@test.com', role: 'admin' };

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

// Mock chart components
vi.mock('@/components/charts', () => ({
  AssetStatusPieChart: () => <div data-testid="asset-status-pie-chart">AssetStatusPieChart</div>,
  CompanyBarChart: () => <div data-testid="company-bar-chart">CompanyBarChart</div>,
  ActivityAreaChart: () => <div data-testid="activity-area-chart">ActivityAreaChart</div>,
  TrendLineChart: () => <div data-testid="trend-line-chart">TrendLineChart</div>,
  ManagerBarChart: () => <div data-testid="manager-bar-chart">ManagerBarChart</div>,
}));

// Mock widget components
vi.mock('@/components/widgets', () => ({
  KPICard: ({ title, value }) => <div data-testid={`kpi-${title}`}>{value}</div>,
  RiskIndicatorList: () => <div data-testid="risk-indicator-list">RiskIndicatorList</div>,
  ComplianceChecklist: () => <div data-testid="compliance-checklist">ComplianceChecklist</div>,
  MetricsComparison: () => <div data-testid="metrics-comparison">MetricsComparison</div>,
  ComplianceAlertBanner: () => <div data-testid="compliance-alert-banner">ComplianceAlertBanner</div>,
}));

// Mock TablePaginationControls
vi.mock('@/components/TablePaginationControls', () => ({
  default: () => <div data-testid="table-pagination">Pagination</div>,
}));

const minimalCompliance = {
  score: 98,
  atRiskAssets: 0,
  overdueAttestations: 0,
  attestedThisQuarter: 0,
  riskIndicators: [],
  campaigns: [],
  checklist: [],
};

const mockComplianceAndSummary = (summaryResponse = { total: 10 }) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => minimalCompliance,
  }).mockResolvedValueOnce({
    ok: true,
    json: async () => summaryResponse,
  });
};

describe('AuditReporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Data Fetch - Issue 1', () => {
    it('should fetch compliance and summary data on initial mount', async () => {
      const mockSummaryEnhanced = {
        total: 100,
        totalChange: 5,
        byStatus: { active: 80, returned: 15, lost: 3, damaged: 2 },
        byCompany: [],
        byManager: [],
        byType: {},
        complianceScore: 85,
      };

      mockComplianceAndSummary(mockSummaryEnhanced);

      render(<AuditReportingNew />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports/compliance',
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
          })
        );
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports/summary-enhanced',
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('should display summary tab content by default', async () => {
      mockComplianceAndSummary({ total: 100 });

      render(<AuditReportingNew />);

      const summaryTab = screen.getByRole('tab', { name: /summary/i });
      expect(summaryTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Period Auto-fetch - Issue 2 & 3', () => {
    it('should auto-fetch stats when period changes from 30 to 7 days', async () => {
      const mockStatsEnhanced = {
        activityByDay: [],
        actionBreakdown: [],
        topUsers: [],
      };

      // Initial load - summary
      mockComplianceAndSummary({ total: 100 });

      const user = userEvent.setup();
      render(<AuditReportingNew />);

      // Clear previous fetch calls
      global.fetch.mockClear();

      // Switch to Statistics tab
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsEnhanced,
      });

      const statsTab = screen.getByRole('tab', { name: /statistics/i });
      await user.click(statsTab);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reports/statistics-enhanced?period=30'),
          expect.any(Object)
        );
      });

      global.fetch.mockClear();

      // Click on 7 Days button
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsEnhanced,
      });

      const sevenDaysButton = screen.getByRole('button', { name: '7 Days' });
      await user.click(sevenDaysButton);

      // Verify fetch is called with new period
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reports/statistics-enhanced?period=7'),
          expect.any(Object)
        );
      });
    });

    it('should auto-fetch trends when period changes from 30 to 90 days', async () => {
      const mockTrends = {
        assetGrowth: [],
        statusChanges: [],
        metricsComparison: null,
      };

      // Initial load - summary
      mockComplianceAndSummary({ total: 100 });

      const user = userEvent.setup();
      render(<AuditReportingNew />);

      global.fetch.mockClear();

      // Switch to Trends tab
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const trendsTab = screen.getByRole('tab', { name: /trends/i });
      await user.click(trendsTab);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reports/trends?period=30'),
          expect.any(Object)
        );
      });

      global.fetch.mockClear();

      // Click on 90 Days button
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const ninetyDaysButton = screen.getByRole('button', { name: '90 Days' });
      await user.click(ninetyDaysButton);

      // Verify fetch is called with new period
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reports/trends?period=90'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Role-Based Tab Visibility', () => {
    beforeEach(() => {
      // Reset mock user to admin before each test
      mockUser = { id: 1, email: 'admin@test.com', role: 'admin' };
    });

    it('should show all tabs for admin users', async () => {
      mockUser = { id: 1, email: 'admin@test.com', role: 'admin' };
      
      mockComplianceAndSummary({ total: 100 });

      render(<AuditReportingNew />);

      expect(screen.getByRole('tab', { name: /summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /statistics/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /compliance/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /trends/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();
    });

    it('should show all tabs for manager users', async () => {
      mockUser = { id: 2, email: 'manager@test.com', role: 'manager' };
      
      mockComplianceAndSummary({ total: 100 });

      render(<AuditReportingNew />);

      expect(screen.getByRole('tab', { name: /summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /statistics/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /compliance/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /trends/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();
    });

    it('should hide Statistics, Compliance, and Trends tabs for employee users', async () => {
      mockUser = { id: 3, email: 'employee@test.com', role: 'employee' };
      
      mockComplianceAndSummary({ total: 100 });

      render(<AuditReportingNew />);

      // Should show Summary and Audit Logs
      expect(screen.getByRole('tab', { name: /summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();

      // Should NOT show Statistics, Compliance, or Trends
      expect(screen.queryByRole('tab', { name: /statistics/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /compliance/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /trends/i })).not.toBeInTheDocument();
    });

    it('should hide all tabs when user is null', async () => {
      mockUser = null;
      
      mockComplianceAndSummary({ total: 100 });

      render(<AuditReportingNew />);

      // Should show Summary and Audit Logs (accessible to authenticated users)
      expect(screen.getByRole('tab', { name: /summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();

      // Should NOT show restricted tabs
      expect(screen.queryByRole('tab', { name: /statistics/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /compliance/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /trends/i })).not.toBeInTheDocument();
    });
  });
});
