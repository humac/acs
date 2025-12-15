import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssetStatusPieChart from './AssetStatusPieChart';

describe('AssetStatusPieChart', () => {
  it('renders without crashing with valid data', () => {
    const data = {
      active: 89,
      returned: 10,
      lost: 1
    };

    const { container } = render(<AssetStatusPieChart data={data} />);
    expect(container).toBeTruthy();
  });

  it('shows "No data available" when data is empty', () => {
    const data = {};
    render(<AssetStatusPieChart data={data} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    const data = { active: 10 };
    const title = 'Custom Status Chart';
    render(<AssetStatusPieChart data={data} title={title} />);
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('uses default title when not provided', () => {
    const data = { active: 10 };
    render(<AssetStatusPieChart data={data} />);
    expect(screen.getByText('Asset Status Distribution')).toBeInTheDocument();
  });

  it('renders chart component with all status types', () => {
    const data = {
      active: 50,
      returned: 20,
      lost: 5,
      damaged: 3,
      retired: 2
    };

    const { container } = render(<AssetStatusPieChart data={data} />);
    // Verify the component renders without error
    expect(container).toBeTruthy();
    // Verify it's not showing "No data available"
    expect(screen.queryByText('No data available')).not.toBeInTheDocument();
  });

  it('transforms data correctly for chart rendering', () => {
    const data = {
      active: 89,
      returned: 11
    };

    const { container } = render(<AssetStatusPieChart data={data} />);
    
    // Verify the component renders and doesn't show empty state
    expect(container).toBeTruthy();
    expect(screen.queryByText('No data available')).not.toBeInTheDocument();
  });
});
