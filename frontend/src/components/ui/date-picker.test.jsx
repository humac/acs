import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker } from './date-picker';

describe('DatePicker', () => {
  it('renders with placeholder when no value', () => {
    render(<DatePicker value="" onChange={() => {}} />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<DatePicker value="" onChange={() => {}} placeholder="Start Date" />);
    expect(screen.getByText('Start Date')).toBeInTheDocument();
  });

  it('displays formatted date when value is provided', () => {
    render(<DatePicker value="2025-06-15" onChange={() => {}} />);
    expect(screen.getByText('2025-06-15')).toBeInTheDocument();
  });

  it('shows clear button when value is set and clearable is true', () => {
    const { container } = render(<DatePicker value="2025-06-15" onChange={() => {}} clearable />);
    // The X icon for clearing should be present
    const clearIcon = container.querySelector('.lucide-x');
    expect(clearIcon).toBeInTheDocument();
  });

  it('does not show clear button when clearable is false', () => {
    const { container } = render(<DatePicker value="2025-06-15" onChange={() => {}} clearable={false} />);
    const clearIcon = container.querySelector('.lucide-x');
    expect(clearIcon).not.toBeInTheDocument();
  });

  it('does not show clear button when value is empty', () => {
    const { container } = render(<DatePicker value="" onChange={() => {}} clearable />);
    const clearIcon = container.querySelector('.lucide-x');
    expect(clearIcon).not.toBeInTheDocument();
  });

  it('calls onChange with empty string when clear is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<DatePicker value="2025-06-15" onChange={handleChange} clearable />);

    const clearIcon = container.querySelector('.lucide-x');
    await user.click(clearIcon);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('applies custom id to trigger button', () => {
    render(<DatePicker value="" onChange={() => {}} id="my-date" />);
    expect(screen.getByRole('button', { name: /pick a date/i })).toHaveAttribute('id', 'my-date');
  });

  it('disables the trigger button when disabled prop is true', () => {
    render(<DatePicker value="" onChange={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('opens the calendar popover when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} />);

    await user.click(screen.getByRole('button'));

    // Calendar should be visible (contains day buttons)
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('calls onChange with ISO date string when a date is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<DatePicker value="2025-06-15" onChange={handleChange} />);

    // Open the popover
    await user.click(screen.getByRole('button', { name: /2025-06-15/i }));

    // Click on day 20 in the calendar
    const day20 = screen.getByRole('gridcell', { name: '20' });
    await user.click(day20.querySelector('button') || day20);

    expect(handleChange).toHaveBeenCalledWith('2025-06-20');
  });

  it('shows placeholder for invalid date value', () => {
    render(<DatePicker value="not-a-date" onChange={() => {}} placeholder="Pick a date" />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('applies custom className to trigger button', () => {
    render(<DatePicker value="" onChange={() => {}} className="w-[200px]" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-[200px]');
  });
});
