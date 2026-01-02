import React from 'react';
import { Shield, Users, TrendingUp, Activity, CheckCircle, Clock } from 'lucide-react';
import {
  BentoGrid,
  BentoCard,
  BentoFeatureCard,
  BentoCardHeader,
  BentoCardTitle,
  BentoCardDescription,
  BentoCardContent,
} from '@/components/ui/bento-grid';
import {
  GlassPanel,
  GlassCard,
  GlassButton,
  GlassInput,
} from '@/components/ui/glass-panel';
import {
  ScrollFadeIn,
  StaggerOnScroll,
  ParallaxContainer,
  RevealOnScroll,
} from '@/components/ui/scroll-animations';
import { StatCard, MiniStat } from '@/components/ui/stat-card';

export default function Phase3Demo() {
  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Header */}
        <ScrollFadeIn>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Phase 3: UI Framework Modernization
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Showcasing Bento Grid layouts, Glassmorphism components, and Advanced Scroll Animations
            </p>
          </div>
        </ScrollFadeIn>

        {/* Stat Cards Section */}
        <section className="space-y-6">
          <ScrollFadeIn delay={0.1}>
            <h2 className="text-2xl font-semibold">Enhanced Stat Cards</h2>
          </ScrollFadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Assets"
              value="1,234"
              change="+12%"
              changeType="positive"
              description="Active assets in system"
              icon={<Shield className="w-5 h-5" />}
            />
            <StatCard
              title="Active Users"
              value="856"
              change="+8%"
              changeType="positive"
              description="Registered users"
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Compliance Score"
              value="98%"
              change="+2%"
              changeType="positive"
              description="Overall compliance"
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <StatCard
              title="Response Time"
              value="1.2s"
              change="-15%"
              changeType="positive"
              description="Average response"
              icon={<Activity className="w-5 h-5" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MiniStat label="Pending Reviews" value="23" icon={<Clock className="w-4 h-4" />} />
            <MiniStat label="Completed" value="156" icon={<CheckCircle className="w-4 h-4" />} />
            <MiniStat label="In Progress" value="42" icon={<TrendingUp className="w-4 h-4" />} />
          </div>
        </section>

        {/* Bento Grid Section */}
        <section className="space-y-6">
          <ScrollFadeIn delay={0.2}>
            <h2 className="text-2xl font-semibold">Bento Grid Layout</h2>
            <p className="text-muted-foreground">
              Apple-inspired responsive grid system with flexible spanning
            </p>
          </ScrollFadeIn>

          <BentoGrid>
            <BentoCard colSpan={2}>
              <BentoCardHeader>
                <BentoCardTitle>Dashboard Overview</BentoCardTitle>
                <BentoCardDescription>
                  Real-time system metrics and performance indicators
                </BentoCardDescription>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Chart placeholder</p>
                </div>
              </BentoCardContent>
            </BentoCard>

            <BentoFeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Security"
              description="Enhanced security protocols and monitoring"
              gradient
            >
              <button className="text-primary text-sm font-medium hover:underline">
                Learn more →
              </button>
            </BentoFeatureCard>

            <BentoFeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Team Management"
              description="Collaborative tools for your team"
            >
              <button className="text-primary text-sm font-medium hover:underline">
                View team →
              </button>
            </BentoFeatureCard>

            <BentoCard rowSpan={2}>
              <BentoCardHeader>
                <BentoCardTitle>Recent Activity</BentoCardTitle>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Activity {i}</p>
                        <p className="text-xs text-muted-foreground">{i} hour ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </BentoCardContent>
            </BentoCard>

            <BentoCard colSpan={2}>
              <BentoCardHeader>
                <BentoCardTitle>Quick Stats</BentoCardTitle>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">12.5K</p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">98.2%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">450ms</p>
                    <p className="text-xs text-muted-foreground">Avg Load</p>
                  </div>
                </div>
              </BentoCardContent>
            </BentoCard>

            <BentoFeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Analytics"
              description="Comprehensive analytics and insights"
              gradient
            />
          </BentoGrid>
        </section>

        {/* Glassmorphism Section */}
        <section className="space-y-6">
          <ScrollFadeIn delay={0.3}>
            <h2 className="text-2xl font-semibold">Glassmorphism Components</h2>
            <p className="text-muted-foreground">
              Modern frosted glass effect with accessible contrast ratios
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard intensity="light">
              <h3 className="font-semibold mb-2">Light Glass</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Subtle transparency with light backdrop blur
              </p>
              <GlassButton>Action</GlassButton>
            </GlassCard>

            <GlassCard intensity="medium">
              <h3 className="font-semibold mb-2">Medium Glass</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Balanced transparency and clarity (default)
              </p>
              <GlassButton>Action</GlassButton>
            </GlassCard>

            <GlassCard intensity="heavy">
              <h3 className="font-semibold mb-2">Heavy Glass</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Strong blur with enhanced readability
              </p>
              <GlassButton>Action</GlassButton>
            </GlassCard>
          </div>

          <GlassPanel className="p-8">
            <h3 className="text-lg font-semibold mb-4">Glass Form Example</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <GlassInput type="email" placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <GlassInput type="password" placeholder="••••••••" />
              </div>
              <div className="flex gap-2">
                <GlassButton className="flex-1">Sign In</GlassButton>
                <GlassButton>Cancel</GlassButton>
              </div>
            </div>
          </GlassPanel>
        </section>

        {/* Scroll Animations Section */}
        <section className="space-y-6">
          <ScrollFadeIn delay={0.4}>
            <h2 className="text-2xl font-semibold">Scroll-Driven Animations</h2>
            <p className="text-muted-foreground">
              Smooth animations triggered by scroll position with IntersectionObserver
            </p>
          </ScrollFadeIn>

          <StaggerOnScroll staggerDelay={0.15}>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">Staggered Item 1</h3>
              <p className="text-sm text-muted-foreground">
                Each item animates with a slight delay for a cascading effect
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">Staggered Item 2</h3>
              <p className="text-sm text-muted-foreground">
                Creates a natural, flowing animation sequence
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">Staggered Item 3</h3>
              <p className="text-sm text-muted-foreground">
                Draws attention without overwhelming the user
              </p>
            </div>
          </StaggerOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevealOnScroll direction="up">
              <div className="bg-card border border-border rounded-xl p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Reveal from Bottom</h3>
                  <p className="text-sm text-muted-foreground">
                    Content slides up with clip-path animation
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll direction="left">
              <div className="bg-card border border-border rounded-xl p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Reveal from Right</h3>
                  <p className="text-sm text-muted-foreground">
                    Content slides in from the side
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          <ParallaxContainer speed={0.5} className="h-64 bg-card border border-border rounded-xl">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Parallax Effect</h3>
                <p className="text-sm text-muted-foreground">
                  This content moves at a different speed as you scroll
                </p>
              </div>
            </div>
          </ParallaxContainer>
        </section>

        {/* Utility Classes Demo */}
        <section className="space-y-6">
          <ScrollFadeIn delay={0.5}>
            <h2 className="text-2xl font-semibold">New Utility Classes</h2>
            <p className="text-muted-foreground">
              CSS utilities for common 2026 design patterns
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border-gradient p-6 rounded-xl">
              <h3 className="font-semibold mb-2">.border-gradient</h3>
              <p className="text-sm text-muted-foreground">
                Animated gradient border effect
              </p>
            </div>

            <div className="hover-lift bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">.hover-lift</h3>
              <p className="text-sm text-muted-foreground">
                Smooth lift effect on hover
              </p>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-2">.glass</h3>
              <p className="text-sm text-muted-foreground">
                Quick glass effect utility
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 glow">
              <h3 className="font-semibold mb-2">.glow</h3>
              <p className="text-sm text-muted-foreground">
                Subtle glow effect for emphasis
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 relative bg-noise">
              <h3 className="font-semibold mb-2">.bg-noise</h3>
              <p className="text-sm text-muted-foreground">
                Subtle texture overlay
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">.bg-gradient-mesh</h3>
              <p className="text-sm text-muted-foreground">
                Multi-layer gradient background
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <ScrollFadeIn delay={0.6}>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              Phase 3 UI Framework Modernization • 2026 Design Trends
            </p>
            <p className="text-xs mt-2">
              All components respect prefers-reduced-motion and support dark mode
            </p>
          </div>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
