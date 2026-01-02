import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  GlassPanel,
  GlassCard,
  GlassButton,
  GlassInput,
} from '@/components/ui/glass-panel';

describe('Glass Panel Components', () => {
  describe('GlassPanel', () => {
    it('should render children', () => {
      render(
        <GlassPanel>
          <div>Panel Content</div>
        </GlassPanel>
      );
      expect(screen.getByText('Panel Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <GlassPanel className="custom-panel">
          <div>Test</div>
        </GlassPanel>
      );
      expect(container.firstChild).toHaveClass('custom-panel');
    });

    it('should apply medium intensity by default', () => {
      const { container } = render(
        <GlassPanel>
          <div>Test</div>
        </GlassPanel>
      );
      expect(container.firstChild).toHaveClass('backdrop-blur-md');
    });

    it('should apply light intensity', () => {
      const { container } = render(
        <GlassPanel intensity="light">
          <div>Test</div>
        </GlassPanel>
      );
      expect(container.firstChild).toHaveClass('backdrop-blur-sm');
    });

    it('should apply heavy intensity', () => {
      const { container } = render(
        <GlassPanel intensity="heavy">
          <div>Test</div>
        </GlassPanel>
      );
      expect(container.firstChild).toHaveClass('backdrop-blur-lg');
    });

    it('should have border and shadow', () => {
      const { container } = render(
        <GlassPanel>
          <div>Test</div>
        </GlassPanel>
      );
      const panel = container.firstChild;
      expect(panel).toHaveClass('border');
      expect(panel).toHaveClass('shadow-elevated');
    });
  });

  describe('GlassCard', () => {
    it('should render children', () => {
      render(
        <GlassCard>
          <div>Card Content</div>
        </GlassCard>
      );
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should have padding', () => {
      const { container } = render(
        <GlassCard>
          <div>Test</div>
        </GlassCard>
      );
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('should accept intensity prop', () => {
      const { container } = render(
        <GlassCard intensity="light">
          <div>Test</div>
        </GlassCard>
      );
      expect(container.firstChild).toHaveClass('backdrop-blur-sm');
    });
  });

  describe('GlassButton', () => {
    it('should render children', () => {
      render(<GlassButton>Click Me</GlassButton>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should be a button element', () => {
      render(<GlassButton>Button</GlassButton>);
      const button = screen.getByRole('button', { name: 'Button' });
      expect(button).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<GlassButton className="custom-btn">Test</GlassButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-btn');
    });

    it('should have glass styling', () => {
      render(<GlassButton>Test</GlassButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('backdrop-blur-md');
      expect(button).toHaveClass('border');
    });
  });

  describe('GlassInput', () => {
    it('should render input', () => {
      render(<GlassInput placeholder="Test Input" />);
      expect(screen.getByPlaceholderText('Test Input')).toBeInTheDocument();
    });

    it('should accept type prop', () => {
      render(<GlassInput type="email" data-testid="email-input" />);
      const input = screen.getByTestId('email-input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should apply custom className', () => {
      render(<GlassInput className="custom-input" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-input');
    });

    it('should have glass styling', () => {
      render(<GlassInput data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('backdrop-blur-md');
      expect(input).toHaveClass('border');
    });

    it('should handle disabled state', () => {
      render(<GlassInput disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
    });
  });
});
