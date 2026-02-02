import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberInput } from './number-input';

describe('NumberInput', () => {
  it('renders with the provided value', () => {
    render(<NumberInput value={5} onChange={() => {}} />);
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('renders increment and decrement buttons', () => {
    render(<NumberInput value={5} onChange={() => {}} />);
    expect(screen.getByLabelText('Decrease value')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase value')).toBeInTheDocument();
  });

  it('calls onChange with incremented value when + is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={5} onChange={handleChange} />);

    await user.click(screen.getByLabelText('Increase value'));

    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it('calls onChange with decremented value when - is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={5} onChange={handleChange} />);

    await user.click(screen.getByLabelText('Decrease value'));

    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('respects min boundary on decrement', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={1} onChange={handleChange} min={1} />);

    // The decrement button should be disabled when at min
    expect(screen.getByLabelText('Decrease value')).toBeDisabled();
  });

  it('respects max boundary on increment', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={10} onChange={handleChange} max={10} />);

    // The increment button should be disabled when at max
    expect(screen.getByLabelText('Increase value')).toBeDisabled();
  });

  it('clamps value to min on decrement past boundary', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={2} onChange={handleChange} min={1} step={5} />);

    await user.click(screen.getByLabelText('Decrease value'));

    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('clamps value to max on increment past boundary', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={8} onChange={handleChange} max={10} step={5} />);

    await user.click(screen.getByLabelText('Increase value'));

    expect(handleChange).toHaveBeenCalledWith(10);
  });

  it('uses custom step size', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={10} onChange={handleChange} step={5} />);

    await user.click(screen.getByLabelText('Increase value'));

    expect(handleChange).toHaveBeenCalledWith(15);
  });

  it('handles typed input by parsing each keystroke', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '4');

    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('clamps typed input to max on single value entry', () => {
    const handleChange = vi.fn();
    render(<NumberInput value="" onChange={handleChange} min={1} max={100} />);

    const input = screen.getByRole('textbox');
    // Simulate typing a value above max directly via change event
    fireEvent.change(input, { target: { value: '999' } });

    expect(handleChange).toHaveBeenCalledWith(100);
  });

  it('clamps typed input to min on single value entry', () => {
    const handleChange = vi.fn();
    render(<NumberInput value="" onChange={handleChange} min={5} max={100} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2' } });

    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('allows empty string as typed value', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={5} onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('increments on ArrowUp key', () => {
    const handleChange = vi.fn();
    render(<NumberInput value={5} onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it('decrements on ArrowDown key', () => {
    const handleChange = vi.fn();
    render(<NumberInput value={5} onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('disables all controls when disabled', () => {
    render(<NumberInput value={5} onChange={() => {}} disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByLabelText('Decrease value')).toBeDisabled();
    expect(screen.getByLabelText('Increase value')).toBeDisabled();
  });

  it('does not call onChange on increment when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value={5} onChange={handleChange} disabled />);

    // Force-click despite disabled (simulating edge case)
    fireEvent.click(screen.getByLabelText('Increase value'));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies custom id to the input', () => {
    render(<NumberInput value={5} onChange={() => {}} id="my-number" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-number');
  });

  it('shows placeholder text when value is empty', () => {
    render(<NumberInput value="" onChange={() => {}} placeholder="Enter amount" />);
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<NumberInput value={5} onChange={() => {}} className="w-32" />);
    expect(container.firstChild.className).toContain('w-32');
  });

  it('handles string value by parsing to number', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput value="5" onChange={handleChange} />);

    await user.click(screen.getByLabelText('Increase value'));

    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it('treats null/undefined value as empty', () => {
    render(<NumberInput value={null} onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
