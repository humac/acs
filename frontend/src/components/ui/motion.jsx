import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Animation presets for 2026 UI trends
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  blurIn: {
    initial: { opacity: 0, filter: "blur(10px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(5px)" },
  },
};

// Spring transition presets
export const transitions = {
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  springBouncy: {
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 0.5,
  },
  smooth: {
    type: "tween",
    ease: [0.4, 0, 0.2, 1],
    duration: 0.3,
  },
  expo: {
    type: "tween",
    ease: [0.16, 1, 0.3, 1],
    duration: 0.5,
  },
};

// Animated wrapper component
export const MotionDiv = React.forwardRef(
  ({ animation = "fadeIn", transition = "spring", className, children, ...props }, ref) => {
    const animationPreset = animations[animation] || animations.fadeIn;
    const transitionPreset = transitions[transition] || transitions.spring;

    return (
      <motion.div
        ref={ref}
        {...animationPreset}
        transition={transitionPreset}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionDiv.displayName = "MotionDiv";

// Animated card with hover effects (2026 micro-interactions)
export const AnimatedCard = React.forwardRef(
  ({ className, children, hoverScale = 1.02, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={transitions.spring}
        whileHover={{
          scale: hoverScale,
          boxShadow: "var(--shadow-elevated)",
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "rounded-xl border border-border bg-card text-card-foreground shadow-soft",
          "transition-colors duration-200",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

// Staggered list container
export const StaggerContainer = React.forwardRef(
  ({ className, children, staggerDelay = 0.1, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
            },
          },
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

// Staggered list item
export const StaggerItem = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: transitions.spring,
          },
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// Page transition wrapper
export const PageTransition = ({ children }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={transitions.expo}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Export AnimatePresence for use in other components
export { AnimatePresence };
