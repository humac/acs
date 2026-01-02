import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  BentoGrid,
  BentoCard,
  BentoCardHeader,
  BentoCardTitle,
  BentoCardDescription,
  BentoCardContent,
  BentoCardFooter,
  BentoFeatureCard,
} from '@/components/ui/bento-grid';

describe('Bento Grid Components', () => {
  describe('BentoGrid', () => {
    it('should render children', () => {
      render(
        <BentoGrid>
          <div>Test Card</div>
        </BentoGrid>
      );
      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <BentoGrid className="custom-grid">
          <div>Test</div>
        </BentoGrid>
      );
      expect(container.firstChild).toHaveClass('custom-grid');
    });

    it('should have grid layout classes', () => {
      const { container } = render(<BentoGrid><div>Test</div></BentoGrid>);
      expect(container.firstChild).toHaveClass('grid');
    });
  });

  describe('BentoCard', () => {
    it('should render children', () => {
      render(
        <BentoCard>
          <div>Card Content</div>
        </BentoCard>
      );
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should render without animation', () => {
      render(
        <BentoCard animated={false}>
          <div>Static Card</div>
        </BentoCard>
      );
      expect(screen.getByText('Static Card')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <BentoCard animated={false} className="custom-card">
          <div>Test</div>
        </BentoCard>
      );
      const card = container.querySelector('.custom-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle colSpan prop', () => {
      render(
        <BentoCard colSpan={2}>
          <div>Wide Card</div>
        </BentoCard>
      );
      expect(screen.getByText('Wide Card')).toBeInTheDocument();
    });

    it('should handle rowSpan prop', () => {
      render(
        <BentoCard rowSpan={2}>
          <div>Tall Card</div>
        </BentoCard>
      );
      expect(screen.getByText('Tall Card')).toBeInTheDocument();
    });
  });

  describe('BentoCardHeader', () => {
    it('should render children', () => {
      render(
        <BentoCardHeader>
          <h3>Header</h3>
        </BentoCardHeader>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
    });
  });

  describe('BentoCardTitle', () => {
    it('should render title', () => {
      render(<BentoCardTitle>Test Title</BentoCardTitle>);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should be an h3 element', () => {
      const { container } = render(<BentoCardTitle>Title</BentoCardTitle>);
      const h3 = container.querySelector('h3');
      expect(h3).toBeInTheDocument();
      expect(h3).toHaveTextContent('Title');
    });
  });

  describe('BentoCardDescription', () => {
    it('should render description', () => {
      render(<BentoCardDescription>Test Description</BentoCardDescription>);
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should be a p element', () => {
      const { container } = render(
        <BentoCardDescription>Description</BentoCardDescription>
      );
      const p = container.querySelector('p');
      expect(p).toBeInTheDocument();
      expect(p).toHaveTextContent('Description');
    });
  });

  describe('BentoCardContent', () => {
    it('should render content', () => {
      render(
        <BentoCardContent>
          <p>Content</p>
        </BentoCardContent>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('BentoCardFooter', () => {
    it('should render footer', () => {
      render(
        <BentoCardFooter>
          <button>Action</button>
        </BentoCardFooter>
      );
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('BentoFeatureCard', () => {
    it('should render title and description', () => {
      render(
        <BentoFeatureCard
          title="Feature Title"
          description="Feature Description"
        />
      );
      expect(screen.getByText('Feature Title')).toBeInTheDocument();
      expect(screen.getByText('Feature Description')).toBeInTheDocument();
    });

    it('should render icon', () => {
      render(
        <BentoFeatureCard
          icon={<span data-testid="icon">📱</span>}
          title="Feature"
        />
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <BentoFeatureCard title="Feature">
          <div>Additional Content</div>
        </BentoFeatureCard>
      );
      expect(screen.getByText('Additional Content')).toBeInTheDocument();
    });

    it('should apply gradient when enabled', () => {
      const { container } = render(
        <BentoFeatureCard title="Feature" gradient />
      );
      const gradientDiv = container.querySelector('.bg-gradient-to-br');
      expect(gradientDiv).toBeInTheDocument();
    });
  });
});
