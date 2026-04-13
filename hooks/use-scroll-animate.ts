"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight AOS-like scroll animation using Intersection Observer.
 * No external library — pure browser API.
 *
 * Usage:
 *   const ref = useScrollAnimate();
 *   <div ref={ref} data-aos="fade-up" data-aos-delay="100">
 *
 * Supported data-aos values: fade-up, fade-in, scale-in, slide-right
 * data-aos-delay: stagger delay in ms (100, 200, 300...)
 */
export function useScrollAnimate<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const elements = container.querySelectorAll("[data-aos]");
    if (elements.length === 0) return;

    // Set initial hidden state via CSS
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = "0";
    });

    // Use a single observer for all elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target as HTMLElement;
          const type = el.dataset.aos || "fade-up";
          const delay = parseInt(el.dataset.aosDelay || "0", 10);

          const animationMap: Record<string, string> = {
            "fade-up": "animate-aos-fade-up",
            "fade-in": "animate-aos-fade-in",
            "scale-in": "animate-aos-scale-in",
            "slide-right": "animate-aos-slide-right",
          };

          const animClass = animationMap[type] || animationMap["fade-up"];

          if (delay > 0) {
            el.style.animationDelay = `${delay}ms`;
          }

          el.style.opacity = "";
          el.classList.add(animClass);
          observer.unobserve(el);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}
