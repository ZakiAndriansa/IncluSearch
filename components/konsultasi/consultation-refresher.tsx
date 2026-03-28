"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polls for new consultation data every 30 seconds and on window focus
export function ConsultationRefresher() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30_000);

    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}
