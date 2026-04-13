"use client";

import { useScrollAnimate } from "@/hooks/use-scroll-animate";

/**
 * Client wrapper for scroll animations.
 * Wraps children and observes any element with data-aos attribute.
 */
export function ScrollAnimate({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollAnimate<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
