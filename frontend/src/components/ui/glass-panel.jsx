import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Glass Panel - Frosted glass effect component
 * Uses backdrop-blur with accessible contrast ratios
 */
const GlassPanel = React.forwardRef(
  ({ className, intensity = "medium", children, ...props }, ref) => {
    const intensityClasses = {
      light: "bg-background/40 dark:bg-background/30 backdrop-blur-sm",
      medium: "bg-background/60 dark:bg-background/50 backdrop-blur-md",
      heavy: "bg-background/80 dark:bg-background/70 backdrop-blur-lg",
    };

    // Validate intensity prop
    const validIntensities = ["light", "medium", "heavy"];
    const effectiveIntensity = validIntensities.includes(intensity) ? intensity : "medium";

    return (
      <div
        ref={ref}
        className={cn(
          intensityClasses[effectiveIntensity],
          "rounded-2xl",
          "border border-border/50 dark:border-border/30",
          "shadow-elevated",
          "ring-1 ring-black/5 dark:ring-white/5",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

/**
 * Glass Card - A card variant with glassmorphism
 */
const GlassCard = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <GlassPanel
        ref={ref}
        className={cn("p-6", className)}
        {...props}
      >
        {children}
      </GlassPanel>
    );
  }
);
GlassCard.displayName = "GlassCard";

/**
 * Glass Button - A button with glass effect
 */
const GlassButton = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "px-4 py-2 rounded-xl",
          "bg-background/60 dark:bg-background/40 backdrop-blur-md",
          "border border-border/50 dark:border-border/30",
          "text-foreground font-medium text-sm",
          "shadow-soft hover:shadow-elevated",
          "transition-all duration-200 ease-out-expo",
          "hover:bg-background/80 dark:hover:bg-background/60",
          "hover:scale-[1.02] active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = "GlassButton";

/**
 * Glass Input - An input with glass effect
 */
const GlassInput = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl px-4 py-2",
          "bg-background/60 dark:bg-background/40 backdrop-blur-md",
          "border border-border/50 dark:border-border/30",
          "text-foreground text-sm",
          "placeholder:text-muted-foreground",
          "shadow-soft",
          "transition-all duration-200",
          "hover:bg-background/80 dark:hover:bg-background/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
GlassInput.displayName = "GlassInput";

export { GlassPanel, GlassCard, GlassButton, GlassInput };
