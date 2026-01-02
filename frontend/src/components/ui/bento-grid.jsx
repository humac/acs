import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Bento Grid Container
 * A responsive grid layout inspired by Apple's Bento design (2026 trend)
 */
const BentoGrid = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4",
        "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
BentoGrid.displayName = "BentoGrid";

/**
 * Bento Grid Item/Card
 * Individual card that can span multiple columns/rows
 */
const BentoCard = React.forwardRef(
  ({ className, children, colSpan = 1, rowSpan = 1, animated = true, ...props }, ref) => {
    const spanClasses = cn(
      colSpan === 2 && "sm:col-span-2",
      colSpan === 3 && "sm:col-span-2 lg:col-span-3",
      colSpan === 4 && "sm:col-span-2 lg:col-span-3 xl:col-span-4",
      rowSpan === 2 && "row-span-2",
      rowSpan === 3 && "row-span-3"
    );

    const cardContent = (
      <div
        ref={!animated ? ref : undefined}
        className={cn(
          "group relative overflow-hidden rounded-2xl",
          "bg-card text-card-foreground",
          "border border-border",
          "shadow-soft hover:shadow-elevated",
          "transition-all duration-300 ease-out-expo",
          spanClasses,
          className
        )}
        {...(!animated ? props : {})}
      >
        {children}
      </div>
    );

    if (!animated) return cardContent;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
        className={cn(spanClasses)}
        {...props}
      >
        <div
          className={cn(
            "h-full group relative overflow-hidden rounded-2xl",
            "bg-card text-card-foreground",
            "border border-border",
            "shadow-soft hover:shadow-elevated",
            "transition-shadow duration-300",
            className
          )}
        >
          {children}
        </div>
      </motion.div>
    );
  }
);
BentoCard.displayName = "BentoCard";

/**
 * Bento Card Header
 */
const BentoCardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
BentoCardHeader.displayName = "BentoCardHeader";

/**
 * Bento Card Title
 */
const BentoCardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
BentoCardTitle.displayName = "BentoCardTitle";

/**
 * Bento Card Description
 */
const BentoCardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
BentoCardDescription.displayName = "BentoCardDescription";

/**
 * Bento Card Content
 */
const BentoCardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
BentoCardContent.displayName = "BentoCardContent";

/**
 * Bento Card Footer
 */
const BentoCardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
BentoCardFooter.displayName = "BentoCardFooter";

/**
 * Bento Feature Card - A specialized card for highlighting features
 */
const BentoFeatureCard = React.forwardRef(
  ({ className, icon, title, description, children, gradient = false, ...props }, ref) => (
    <BentoCard ref={ref} className={cn("p-0", className)} {...props}>
      <div className={cn(
        "h-full flex flex-col p-6",
        gradient && "bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
      )}>
        {icon && (
          <div className="mb-4 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        {title && (
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
        )}
        {children}
      </div>
    </BentoCard>
  )
);
BentoFeatureCard.displayName = "BentoFeatureCard";

export {
  BentoGrid,
  BentoCard,
  BentoCardHeader,
  BentoCardTitle,
  BentoCardDescription,
  BentoCardContent,
  BentoCardFooter,
  BentoFeatureCard,
};
