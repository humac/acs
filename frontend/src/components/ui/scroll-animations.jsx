import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

/**
 * Scroll Fade In - Fades in element as it enters viewport
 */
const ScrollFadeIn = React.forwardRef(
  ({ className, children, threshold = 0.1, delay = 0, ...props }, ref) => {
    const localRef = React.useRef(null);
    const elementRef = ref || localRef;
    const isInView = useInView(elementRef, { once: true, amount: threshold });

    return (
      <motion.div
        ref={elementRef}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{
          duration: 0.6,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ScrollFadeIn.displayName = "ScrollFadeIn";

/**
 * Scroll Scale - Scales element based on scroll position
 */
const ScrollScale = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const localRef = React.useRef(null);
    const elementRef = ref || localRef;
    const { scrollYProgress } = useScroll({
      target: elementRef,
      offset: ["start end", "end start"],
    });

    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

    return (
      <motion.div
        ref={elementRef}
        style={{ scale, opacity }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ScrollScale.displayName = "ScrollScale";

/**
 * Parallax Container - Creates parallax scrolling effect
 */
const ParallaxContainer = React.forwardRef(
  ({ className, children, speed = 0.5, ...props }, ref) => {
    const localRef = React.useRef(null);
    const elementRef = ref || localRef;
    const { scrollYProgress } = useScroll({
      target: elementRef,
      offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);

    return (
      <div ref={elementRef} className={cn("overflow-hidden", className)} {...props}>
        <motion.div style={{ y }}>
          {children}
        </motion.div>
      </div>
    );
  }
);
ParallaxContainer.displayName = "ParallaxContainer";

/**
 * Stagger Children - Staggers animation of child elements on scroll
 */
const StaggerOnScroll = React.forwardRef(
  ({ className, children, staggerDelay = 0.1, ...props }, ref) => {
    const localRef = React.useRef(null);
    const elementRef = ref || localRef;
    const isInView = useInView(elementRef, { once: true, amount: 0.2 });

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      },
    };

    return (
      <motion.div
        ref={elementRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className={className}
        {...props}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={itemVariants}>{child}</motion.div>
        ))}
      </motion.div>
    );
  }
);
StaggerOnScroll.displayName = "StaggerOnScroll";

/**
 * Reveal On Scroll - Reveals content with a clip/mask animation
 */
const RevealOnScroll = React.forwardRef(
  ({ className, children, direction = "up", ...props }, ref) => {
    const localRef = React.useRef(null);
    const elementRef = ref || localRef;
    const isInView = useInView(elementRef, { once: true, amount: 0.3 });

    const directionVariants = {
      up: { clipPath: "inset(100% 0% 0% 0%)" },
      down: { clipPath: "inset(0% 0% 100% 0%)" },
      left: { clipPath: "inset(0% 100% 0% 0%)" },
      right: { clipPath: "inset(0% 0% 0% 100%)" },
    };

    return (
      <motion.div
        ref={elementRef}
        initial={directionVariants[direction]}
        animate={isInView ? { clipPath: "inset(0% 0% 0% 0%)" } : directionVariants[direction]}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
RevealOnScroll.displayName = "RevealOnScroll";

export {
  ScrollFadeIn,
  ScrollScale,
  ParallaxContainer,
  StaggerOnScroll,
  RevealOnScroll,
};
