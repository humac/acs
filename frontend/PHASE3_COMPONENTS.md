# Phase 3: UI Framework Modernization - Component Documentation

## Overview

Phase 3 introduces cutting-edge 2026 UI trends including Bento grid layouts, glassmorphism components, scroll-driven animations, and enhanced stat cards. All components are fully tested, accessible, and support both light and dark modes.

## 📦 New Components

### 1. Bento Grid (`bento-grid.jsx`)

Apple-inspired responsive grid layout system for creating dynamic dashboard layouts.

#### Components

- **`BentoGrid`** - Container with responsive grid layout
- **`BentoCard`** - Individual card with column/row spanning
- **`BentoFeatureCard`** - Specialized card for highlighting features
- **`BentoCardHeader`** - Card header section
- **`BentoCardTitle`** - Card title (h3)
- **`BentoCardDescription`** - Card description
- **`BentoCardContent`** - Main card content area
- **`BentoCardFooter`** - Card footer section

#### Usage Examples

```jsx
import { BentoGrid, BentoCard, BentoFeatureCard } from '@/components/ui/bento-grid';

// Basic grid
<BentoGrid>
  <BentoCard>Content 1</BentoCard>
  <BentoCard>Content 2</BentoCard>
  <BentoCard>Content 3</BentoCard>
</BentoGrid>

// Card spanning multiple columns/rows
<BentoGrid>
  <BentoCard colSpan={2}>
    <BentoCardHeader>
      <BentoCardTitle>Wide Card</BentoCardTitle>
      <BentoCardDescription>Spans 2 columns</BentoCardDescription>
    </BentoCardHeader>
    <BentoCardContent>
      {/* Your content */}
    </BentoCardContent>
  </BentoCard>
  
  <BentoCard rowSpan={2}>Tall card</BentoCard>
  
  <BentoFeatureCard
    icon={<Shield />}
    title="Feature"
    description="Highlight important features"
    gradient
  >
    <button>Learn more →</button>
  </BentoFeatureCard>
</BentoGrid>

// Disable animation for performance
<BentoCard animated={false}>
  Static content
</BentoCard>
```

#### Props

**BentoGrid**
- `className` - Additional CSS classes
- `children` - React nodes

**BentoCard**
- `colSpan` - Number of columns to span (1-4)
- `rowSpan` - Number of rows to span (1-3)
- `animated` - Enable Framer Motion animations (default: true)
- `className` - Additional CSS classes
- `children` - React nodes

**BentoFeatureCard**
- `icon` - React node for icon
- `title` - Feature title
- `description` - Feature description
- `gradient` - Enable gradient background (default: false)
- `children` - Additional content
- `className` - Additional CSS classes

#### Responsive Behavior

- Mobile (< 640px): 1 column
- Tablet (640px+): 2 columns
- Desktop (1024px+): 3 columns
- Large (1280px+): 4 columns

### 2. Glass Panel (`glass-panel.jsx`)

Glassmorphism components with frosted glass effect and accessible contrast ratios.

#### Components

- **`GlassPanel`** - Base glass panel with configurable blur intensity
- **`GlassCard`** - Glass panel with padding
- **`GlassButton`** - Button with glass effect
- **`GlassInput`** - Input field with glass effect

#### Usage Examples

```jsx
import { GlassPanel, GlassCard, GlassButton, GlassInput } from '@/components/ui/glass-panel';

// Basic glass panel
<GlassPanel intensity="medium">
  Content with glass effect
</GlassPanel>

// Glass card (with padding)
<GlassCard intensity="light">
  <h3>Card Title</h3>
  <p>Card content</p>
</GlassCard>

// Glass form
<GlassPanel className="p-6">
  <GlassInput type="email" placeholder="Email" />
  <GlassInput type="password" placeholder="Password" />
  <GlassButton>Submit</GlassButton>
</GlassPanel>
```

#### Props

**GlassPanel / GlassCard**
- `intensity` - Blur intensity: `"light"` | `"medium"` | `"heavy"` (default: "medium")
- `className` - Additional CSS classes
- `children` - React nodes

**GlassButton**
- Standard button props
- `className` - Additional CSS classes
- `children` - React nodes

**GlassInput**
- Standard input props
- `type` - Input type
- `className` - Additional CSS classes

#### Accessibility

All glassmorphism components maintain WCAG AA contrast ratios in both light and dark modes.

### 3. Scroll Animations (`scroll-animations.jsx`)

Smooth animations triggered by scroll position using Framer Motion and IntersectionObserver.

#### Components

- **`ScrollFadeIn`** - Fades in when entering viewport
- **`ScrollScale`** - Scales based on scroll position
- **`ParallaxContainer`** - Creates parallax scrolling effect
- **`StaggerOnScroll`** - Staggers child animations
- **`RevealOnScroll`** - Reveals with clip-path animation

#### Usage Examples

```jsx
import {
  ScrollFadeIn,
  StaggerOnScroll,
  ParallaxContainer,
  RevealOnScroll
} from '@/components/ui/scroll-animations';

// Fade in on scroll
<ScrollFadeIn threshold={0.2} delay={0.1}>
  <div>Content fades in</div>
</ScrollFadeIn>

// Stagger children animations
<StaggerOnScroll staggerDelay={0.15}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggerOnScroll>

// Parallax effect
<ParallaxContainer speed={0.5}>
  <div>Moves at different speed</div>
</ParallaxContainer>

// Reveal with direction
<RevealOnScroll direction="up">
  <div>Slides up with clip mask</div>
</RevealOnScroll>
```

#### Props

**ScrollFadeIn**
- `threshold` - IntersectionObserver threshold (0-1, default: 0.1)
- `delay` - Animation delay in seconds (default: 0)
- `className` - Additional CSS classes
- `children` - React nodes

**StaggerOnScroll**
- `staggerDelay` - Delay between child animations (default: 0.1)
- `className` - Additional CSS classes
- `children` - React nodes

**ParallaxContainer**
- `speed` - Parallax speed multiplier (default: 0.5)
- `className` - Additional CSS classes
- `children` - React nodes

**RevealOnScroll**
- `direction` - Reveal direction: `"up"` | `"down"` | `"left"` | `"right"` (default: "up")
- `className` - Additional CSS classes
- `children` - React nodes

#### Motion Preferences

All scroll animations automatically respect `prefers-reduced-motion` setting. When enabled, animations are disabled or significantly reduced.

### 4. Stat Card (`stat-card.jsx`)

Enhanced stat cards for displaying metrics with trend indicators.

#### Components

- **`StatCard`** - Main stat card with value, change, and icon
- **`MiniStat`** - Compact stat display

#### Usage Examples

```jsx
import { StatCard, MiniStat } from '@/components/ui/stat-card';

// Full stat card
<StatCard
  title="Total Users"
  value="1,234"
  change="+12%"
  changeType="positive"
  description="Active this month"
  icon={<Users className="w-5 h-5" />}
  animated={true}
/>

// Negative trend
<StatCard
  title="Error Rate"
  value="0.5%"
  change="-50%"
  changeType="positive"  // Lower error rate is good
  icon={<AlertCircle className="w-5 h-5" />}
/>

// Mini stat (compact)
<MiniStat
  label="Pending"
  value="23"
  icon={<Clock className="w-4 h-4" />}
/>
```

#### Props

**StatCard**
- `title` - Stat label/title
- `value` - Main value to display
- `change` - Change indicator (e.g., "+12%")
- `changeType` - Visual style: `"positive"` | `"negative"` | `"neutral"` (default: "neutral")
- `icon` - React node for icon
- `description` - Additional description
- `animated` - Enable animations (default: true)
- `className` - Additional CSS classes

**MiniStat**
- `label` - Stat label
- `value` - Value to display
- `icon` - React node for icon
- `className` - Additional CSS classes

## 🎨 New CSS Utility Classes

### Bento Grid Utilities

```css
.bento-grid       /* Auto-fit grid layout */
.bento-span-2     /* Span 2 columns */
.bento-span-3     /* Span 3 columns */
.bento-row-2      /* Span 2 rows */
```

### Glassmorphism Utilities

```css
.glass            /* Medium glass effect */
.glass-light      /* Light glass effect */
.glass-heavy      /* Heavy glass effect */
```

### Visual Effects

```css
.bg-gradient-mesh /* Multi-layer gradient background */
.bg-noise         /* Subtle texture overlay */
.glow             /* Primary color glow */
.glow-success     /* Success color glow */
.hover-lift       /* Lift on hover */
.border-gradient  /* Gradient border */
```

## 📱 Responsive Design

All components are fully responsive:

- **Mobile-first approach**: Base styles for mobile devices
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- **Flexible layouts**: Components adapt to container width
- **Touch-friendly**: Appropriate sizing for touch targets

## 🌗 Dark Mode Support

All Phase 3 components fully support dark mode:

- Automatic color adaptation using CSS variables
- Glassmorphism maintains proper contrast in dark mode
- Border and shadow adjustments for dark backgrounds
- No manual theme switching required

Test dark mode:
```jsx
// Toggle dark mode on root element
document.documentElement.classList.toggle('dark');
```

## ♿ Accessibility

### WCAG Compliance

- ✅ **WCAG AA contrast ratios** maintained in all color combinations
- ✅ **Keyboard navigation** fully supported
- ✅ **Focus indicators** visible on all interactive elements
- ✅ **Screen reader friendly** with semantic HTML

### Motion Preferences

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled or reduced to instant transitions */
}
```

Test reduced motion:
```javascript
// Simulate reduced motion preference
matchMedia('(prefers-reduced-motion: reduce)').matches
```

## 🧪 Testing

All components include comprehensive test coverage:

- **71 new tests** for Phase 3 components
- **391 total tests passing** in the test suite
- **IntersectionObserver mock** for scroll animation testing
- Tests cover all props and edge cases

Run tests:
```bash
cd frontend
npm test

# Run specific component tests
npm test bento-grid.test.jsx
npm test glass-panel.test.jsx
npm test scroll-animations.test.jsx
npm test stat-card.test.jsx
```

## 🚀 Performance

### Optimization Tips

1. **Disable animations for static content**:
```jsx
<BentoCard animated={false}>Static content</BentoCard>
<StatCard animated={false} />
```

2. **Use lazy loading for scroll animations**:
```jsx
// Components only animate when scrolled into view
// No performance impact for off-screen content
```

3. **GPU acceleration**:
All animations use `transform` and `opacity` for optimal GPU acceleration.

4. **Bundle size**:
- Total added CSS: ~2KB (gzipped)
- Framer Motion already included in Phase 1
- No additional dependencies

## 📊 Component Comparison

| Component | Use Case | Animation | Dark Mode | Tests |
|-----------|----------|-----------|-----------|-------|
| BentoGrid | Dashboard layouts | ✅ Optional | ✅ | 19 |
| GlassPanel | Overlays, cards | ❌ | ✅ | 18 |
| ScrollFadeIn | Content reveals | ✅ | ✅ | 4 |
| StaggerOnScroll | List animations | ✅ | ✅ | 4 |
| StatCard | Metrics display | ✅ Optional | ✅ | 14 |

## 🎯 Usage Guidelines

### When to Use Bento Grid

✅ **Good for:**
- Dashboard layouts
- Feature showcases
- Mixed content types
- Flexible content sizes

❌ **Avoid for:**
- Simple lists (use regular grid)
- Data tables (use Table component)
- Forms (use standard layouts)

### When to Use Glassmorphism

✅ **Good for:**
- Hero sections with background images
- Overlays and modals
- Floating cards
- Modern aesthetic emphasis

❌ **Avoid for:**
- Primary content areas (readability)
- Heavy text content
- Print styles
- High contrast requirements

### When to Use Scroll Animations

✅ **Good for:**
- Marketing pages
- Feature introductions
- Step-by-step guides
- Visual storytelling

❌ **Avoid for:**
- Dashboard UIs
- Forms and data entry
- Frequently accessed content
- Print layouts

## 🔗 Integration Examples

### Dashboard with All Components

```jsx
import {
  BentoGrid,
  BentoCard,
  BentoFeatureCard,
  GlassCard,
  StatCard,
  ScrollFadeIn,
  StaggerOnScroll
} from '@/components/ui';

function Dashboard() {
  return (
    <div className="bg-gradient-mesh min-h-screen p-8">
      <ScrollFadeIn>
        <h1>Dashboard</h1>
      </ScrollFadeIn>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Users" value="1.2K" change="+12%" changeType="positive" />
        <StatCard title="Revenue" value="$45K" change="+8%" changeType="positive" />
        <StatCard title="Tasks" value="234" change="-5%" changeType="negative" />
        <StatCard title="Uptime" value="99.9%" changeType="neutral" />
      </div>

      {/* Main content with Bento grid */}
      <BentoGrid>
        <BentoCard colSpan={2}>
          <BentoCardHeader>
            <BentoCardTitle>Overview</BentoCardTitle>
          </BentoCardHeader>
          <BentoCardContent>
            {/* Chart or content */}
          </BentoCardContent>
        </BentoCard>
        
        <BentoFeatureCard
          icon={<Shield />}
          title="Security"
          gradient
        />
        
        <BentoCard rowSpan={2}>
          {/* Tall sidebar content */}
        </BentoCard>
      </BentoGrid>

      {/* Glass overlay */}
      <GlassCard className="mt-8">
        <h3>Featured Content</h3>
        <p>Important information in a glass card</p>
      </GlassCard>
    </div>
  );
}
```

## 📖 Demo Page

Visit `/phase3-demo` (admin only) to see all components in action with:
- Live examples
- Interactive demonstrations
- Dark mode toggle
- Responsive behavior
- Scroll animations

## 🔄 Migration from Existing Components

### From Card to BentoCard

```jsx
// Before
<div className="grid grid-cols-3 gap-4">
  <Card>Content</Card>
  <Card>Content</Card>
  <Card>Content</Card>
</div>

// After
<BentoGrid>
  <BentoCard>Content</BentoCard>
  <BentoCard>Content</BentoCard>
  <BentoCard>Content</BentoCard>
</BentoGrid>
```

### From Regular Input to GlassInput

```jsx
// Before
<Input type="email" placeholder="Email" />

// After (when using glass aesthetic)
<GlassInput type="email" placeholder="Email" />
```

### Adding Scroll Animations

```jsx
// Before
<div className="content">
  <h2>Title</h2>
  <p>Description</p>
</div>

// After
<ScrollFadeIn>
  <div className="content">
    <h2>Title</h2>
    <p>Description</p>
  </div>
</ScrollFadeIn>
```

## 🐛 Troubleshooting

### Glassmorphism looks unclear

- Ensure sufficient background contrast
- Try different intensity levels
- Check dark mode support
- Verify backdrop-blur browser support

### Scroll animations not triggering

- Check IntersectionObserver browser support
- Verify element is in viewport
- Adjust threshold values
- Check for conflicting CSS

### Bento grid not responsive

- Ensure container has proper width
- Check for conflicting grid styles
- Verify Tailwind CSS is working
- Test at different breakpoints

## 📚 References

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🎉 Summary

Phase 3 delivers:
- ✅ 4 new component families (19 individual components)
- ✅ 71 comprehensive tests
- ✅ 10+ new CSS utility classes
- ✅ Full dark mode support
- ✅ WCAG AA accessibility
- ✅ Responsive design
- ✅ Motion preference support
- ✅ Complete documentation
- ✅ Live demo page

Ready to use in production! 🚀
