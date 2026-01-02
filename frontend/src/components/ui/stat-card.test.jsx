import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  StatCard,
  MiniStat,
} from '@/components/ui/stat-card';

describe('Stat Card Components', () => {
  describe('StatCard', () => {
    it('should render title and value', () => {
      render(<StatCard title="Total Users" value="1,234" />);
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(
        <StatCard
          title="Revenue"
          value="$50K"
          description="This month"
        />
      );
      expect(screen.getByText('This month')).toBeInTheDocument();
    });

    it('should render change indicator', () => {
      render(
        <StatCard
          title="Growth"
          value="25%"
          change="+12%"
          changeType="positive"
        />
      );
      expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('should show positive change with up arrow', () => {
      const { container } = render(
        <StatCard
          title="Sales"
          value="100"
          change="+10%"
          changeType="positive"
        />
      );
      expect(screen.getByText('↑')).toBeInTheDocument();
      const changeElement = screen.getByText('+10%').parentElement;
      expect(changeElement).toHaveClass('text-success');
    });

    it('should show negative change with down arrow', () => {
      const { container } = render(
        <StatCard
          title="Errors"
          value="5"
          change="-20%"
          changeType="negative"
        />
      );
      expect(screen.getByText('↓')).toBeInTheDocument();
      const changeElement = screen.getByText('-20%').parentElement;
      expect(changeElement).toHaveClass('text-destructive');
    });

    it('should show neutral change with arrow', () => {
      render(
        <StatCard
          title="Status"
          value="Stable"
          change="0%"
          changeType="neutral"
        />
      );
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('should render icon', () => {
      render(
        <StatCard
          title="Users"
          value="100"
          icon={<span data-testid="icon">👤</span>}
        />
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render without animation', () => {
      render(
        <StatCard
          title="Static"
          value="50"
          animated={false}
        />
      );
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StatCard
          title="Test"
          value="100"
          animated={false}
          className="custom-stat"
        />
      );
      const statCard = container.querySelector('.custom-stat');
      expect(statCard).toBeInTheDocument();
    });

    it('should have card styling', () => {
      const { container } = render(
        <StatCard title="Test" value="100" animated={false} />
      );
      const card = container.querySelector('.rounded-2xl');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('border');
    });
  });

  describe('MiniStat', () => {
    it('should render label and value', () => {
      render(<MiniStat label="Active" value="42" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render icon', () => {
      render(
        <MiniStat
          label="Count"
          value="10"
          icon={<span data-testid="mini-icon">🔢</span>}
        />
      );
      expect(screen.getByTestId('mini-icon')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <MiniStat
          label="Test"
          value="5"
          className="custom-mini"
        />
      );
      expect(container.firstChild).toHaveClass('custom-mini');
    });

    it('should have compact styling', () => {
      const { container } = render(
        <MiniStat label="Test" value="5" />
      );
      const miniStat = container.firstChild;
      expect(miniStat).toHaveClass('flex');
      expect(miniStat).toHaveClass('items-center');
      expect(miniStat).toHaveClass('p-3');
    });
  });
});
