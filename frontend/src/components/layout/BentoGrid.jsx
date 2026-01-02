import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BentoGrid - A modern dashboard grid layout following 2026 design trends.
 * Uses a 4-column grid on desktop that collapses to single column on mobile.
 */
const BentoGrid = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(12rem,auto)] md:auto-rows-[20rem]",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
BentoGrid.displayName = "BentoGrid";

/**
 * BentoItem - Individual grid item for BentoGrid layout.
 * Supports large (2x2), wide (2x1), tall (1x2), and default (1x1) sizes.
 */
const BentoItem = React.forwardRef(
  ({ className, children, isLarge, isWide, isTall, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bento-card overflow-hidden",
        isLarge && "md:col-span-2 md:row-span-2",
        isWide && !isLarge && "md:col-span-2 md:row-span-1",
        isTall && !isLarge && "md:col-span-1 md:row-span-2",
        !isLarge && !isWide && !isTall && "md:col-span-1 md:row-span-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
BentoItem.displayName = "BentoItem";

/**
 * BentoSkeleton - Loading skeleton for BentoItem with shimmer effect.
 */
const BentoSkeleton = React.forwardRef(
  ({ className, isLarge, isWide, isTall, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bento-card overflow-hidden shimmer",
        isLarge && "md:col-span-2 md:row-span-2",
        isWide && !isLarge && "md:col-span-2 md:row-span-1",
        isTall && !isLarge && "md:col-span-1 md:row-span-2",
        !isLarge && !isWide && !isTall && "md:col-span-1 md:row-span-1",
        className
      )}
      {...props}
    >
      <div className="h-full w-full bg-muted/30 animate-pulse" />
    </div>
  )
);
BentoSkeleton.displayName = "BentoSkeleton";

export { BentoGrid, BentoItem, BentoSkeleton };
