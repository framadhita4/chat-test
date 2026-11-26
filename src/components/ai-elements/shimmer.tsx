"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import type { CSSProperties, ElementType } from "react";
import { memo, useMemo } from "react";

const MotionParagraph = motion.p;
const MotionSpan = motion.span;
const MotionDiv = motion.div;

export interface TextShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  );

  const sharedClassName = cn(
    "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
    "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
    className
  );
  const sharedStyle = {
    "--spread": `${dynamicSpread}px`,
    backgroundImage:
      "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
  } as CSSProperties;
  const sharedTransition = {
    duration,
    ease: "linear" as const,
    repeat: Number.POSITIVE_INFINITY,
  };

  if (Component === "span") {
    return (
      <MotionSpan
        animate={{ backgroundPosition: "0% center" }}
        className={sharedClassName}
        initial={{ backgroundPosition: "100% center" }}
        style={sharedStyle}
        transition={sharedTransition}
      >
        {children}
      </MotionSpan>
    );
  }

  if (Component === "div") {
    return (
      <MotionDiv
        animate={{ backgroundPosition: "0% center" }}
        className={sharedClassName}
        initial={{ backgroundPosition: "100% center" }}
        style={sharedStyle}
        transition={sharedTransition}
      >
        {children}
      </MotionDiv>
    );
  }

  return (
    <MotionParagraph
      animate={{ backgroundPosition: "0% center" }}
      className={sharedClassName}
      initial={{ backgroundPosition: "100% center" }}
      style={sharedStyle}
      transition={sharedTransition}
    >
      {children}
    </MotionParagraph>
  );
};

export const Shimmer = memo(ShimmerComponent);
