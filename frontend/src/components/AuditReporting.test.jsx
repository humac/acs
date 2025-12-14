import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditReportingNew from './AuditReporting';

// Mock fetch
global.fetch = vi.fn();

// Mock useAuth hook
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      getAuthHeaders: mockGetAuthHeaders,
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
}));

// Mock TablePaginationControls
vi.mock('@/components/TablePaginationControls', () => ({
  default: () => <div data-testid="table-pagination">Pagination</div>,
}));

describe('AuditReporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Data Fetch - Issue 1', () => {
    it('should fetch summary data on initial mount', async () => {
      const mockSummaryEnhanced = {
        total: 100,
        totalChange: 5,
        byStatus: { active: 80, returned: 15, lost: 3, damaged: 2 },
        byCompany: [],
        byManager: [],
        byType: {},
        complianceScore: 85,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 10 }), // summary
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummaryEnhanced, // summary-enhanced
      });

      render(<AuditReportingNew />);

      // Wait for the fetch calls to be made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports/summary',
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

      // Verify data is displayed
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('should display summary tab content by default', async () => {
      const mockSummaryEnhanced = {
        total: 100,
        totalChange: 5,
        byStatus: { active: 80, returned: 15, lost: 3, damaged: 2 },
        byCompany: [],
        byManager: [],
        byType: {},
        complianceScore: 85,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 10 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummaryEnhanced,
      });

      render(<AuditReportingNew />);

      // Check that Summary tab is active
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
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 10 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 100 }),
      });

      const user = userEvent.setup();
      render(<AuditReportingNew />);

      // Clear previous fetch calls
      global.fetch.mockClear();

      // Switch to Statistics tab
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      }).mockResolvedValueOnce({
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
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 10 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 100 }),
      });

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
});
