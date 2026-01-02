import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Stat Card - Displays a statistic with optional trend indicator
 */
const StatCard = React.forwardRef(
  ({ 
    className, 
    title, 
    value, 
    change, 
    changeType = "neutral", 
    icon,
    description,
    animated = true,
    ...props 
  }, ref) => {
    const changeColors = {
      positive: "text-success",
      negative: "text-destructive",
      neutral: "text-muted-foreground",
    };

    const changeIcons = {
      positive: "↑",
      negative: "↓",
      neutral: "→",
    };

    const content = (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-6",
          "bg-card text-card-foreground",
          "border border-border",
          "shadow-soft hover:shadow-elevated",
          "transition-all duration-300",
          className
        )}
      >
        {/* Background gradient decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
          </div>
          
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {change && (
              <span className={cn("text-sm font-medium flex items-center gap-0.5 mb-1", changeColors[changeType])}>
                <span>{changeIcons[changeType]}</span>
                <span>{change}</span>
              </span>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    );

    if (!animated) {
      return <div ref={ref} {...props}>{content}</div>;
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        {...props}
      >
        {content}
      </motion.div>
    );
  }
);
StatCard.displayName = "StatCard";

/**
 * Mini Stat - Compact stat display
 */
const MiniStat = React.forwardRef(
  ({ className, label, value, icon, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-muted/50",
        "transition-colors duration-200 hover:bg-muted",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
);
MiniStat.displayName = "MiniStat";

export { StatCard, MiniStat };
