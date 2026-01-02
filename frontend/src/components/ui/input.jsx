import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-border/50 bg-muted/30 px-4 py-2 text-sm shadow-sm transition-all duration-200",
        "placeholder:text-muted-foreground/70",
        "hover:border-primary/30 hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:bg-background focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
