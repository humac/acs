import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ScrollFadeIn,
  ScrollScale,
  ParallaxContainer,
  StaggerOnScroll,
  RevealOnScroll,
} from '@/components/ui/scroll-animations';

describe('Scroll Animation Components', () => {
  describe('ScrollFadeIn', () => {
    it('should render children', () => {
      render(
        <ScrollFadeIn>
          <div>Fade Content</div>
        </ScrollFadeIn>
      );
      expect(screen.getByText('Fade Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ScrollFadeIn className="custom-fade">
          <div>Test</div>
        </ScrollFadeIn>
      );
      expect(container.firstChild).toHaveClass('custom-fade');
    });

    it('should accept threshold prop', () => {
      render(
        <ScrollFadeIn threshold={0.5}>
          <div>Test</div>
        </ScrollFadeIn>
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should accept delay prop', () => {
      render(
        <ScrollFadeIn delay={0.3}>
          <div>Test</div>
        </ScrollFadeIn>
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('ScrollScale', () => {
    it('should render children', () => {
      render(
        <ScrollScale>
          <div>Scale Content</div>
        </ScrollScale>
      );
      expect(screen.getByText('Scale Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ScrollScale className="custom-scale">
          <div>Test</div>
        </ScrollScale>
      );
      expect(container.firstChild).toHaveClass('custom-scale');
    });
  });

  describe('ParallaxContainer', () => {
    it('should render children', () => {
      render(
        <ParallaxContainer>
          <div>Parallax Content</div>
        </ParallaxContainer>
      );
      expect(screen.getByText('Parallax Content')).toBeInTheDocument();
    });

    it('should have overflow hidden', () => {
      const { container } = render(
        <ParallaxContainer>
          <div>Test</div>
        </ParallaxContainer>
      );
      expect(container.firstChild).toHaveClass('overflow-hidden');
    });

    it('should accept speed prop', () => {
      render(
        <ParallaxContainer speed={0.8}>
          <div>Test</div>
        </ParallaxContainer>
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ParallaxContainer className="custom-parallax">
          <div>Test</div>
        </ParallaxContainer>
      );
      expect(container.firstChild).toHaveClass('custom-parallax');
    });
  });

  describe('StaggerOnScroll', () => {
    it('should render children', () => {
      render(
        <StaggerOnScroll>
          <div>Child 1</div>
          <div>Child 2</div>
        </StaggerOnScroll>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should wrap children in motion divs', () => {
      const { container } = render(
        <StaggerOnScroll>
          <div>Child 1</div>
          <div>Child 2</div>
        </StaggerOnScroll>
      );
      // Children should be wrapped in motion divs
      const children = container.querySelectorAll('div > div');
      expect(children.length).toBeGreaterThanOrEqual(2);
    });

    it('should accept staggerDelay prop', () => {
      render(
        <StaggerOnScroll staggerDelay={0.2}>
          <div>Test 1</div>
          <div>Test 2</div>
        </StaggerOnScroll>
      );
      expect(screen.getByText('Test 1')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StaggerOnScroll className="custom-stagger">
          <div>Test</div>
        </StaggerOnScroll>
      );
      expect(container.firstChild).toHaveClass('custom-stagger');
    });
  });

  describe('RevealOnScroll', () => {
    it('should render children', () => {
      render(
        <RevealOnScroll>
          <div>Reveal Content</div>
        </RevealOnScroll>
      );
      expect(screen.getByText('Reveal Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <RevealOnScroll className="custom-reveal">
          <div>Test</div>
        </RevealOnScroll>
      );
      expect(container.firstChild).toHaveClass('custom-reveal');
    });

    it('should accept direction prop - up', () => {
      render(
        <RevealOnScroll direction="up">
          <div>Up</div>
        </RevealOnScroll>
      );
      expect(screen.getByText('Up')).toBeInTheDocument();
    });

    it('should accept direction prop - down', () => {
      render(
        <RevealOnScroll direction="down">
          <div>Down</div>
        </RevealOnScroll>
      );
      expect(screen.getByText('Down')).toBeInTheDocument();
    });

    it('should accept direction prop - left', () => {
      render(
        <RevealOnScroll direction="left">
          <div>Left</div>
        </RevealOnScroll>
      );
      expect(screen.getByText('Left')).toBeInTheDocument();
    });

    it('should accept direction prop - right', () => {
      render(
        <RevealOnScroll direction="right">
          <div>Right</div>
        </RevealOnScroll>
      );
      expect(screen.getByText('Right')).toBeInTheDocument();
    });
  });
});
