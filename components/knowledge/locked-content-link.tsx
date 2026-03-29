"use client";

import { useState } from "react";
import { PremiumGateModal } from "@/components/knowledge/premium-gate-modal";

interface LockedContentLinkProps {
  title: string;
  children: React.ReactNode;
}

export function LockedContentLink({ title, children }: LockedContentLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PremiumGateModal open={open} onClose={() => setOpen(false)} contentTitle={title} />
      <div
        className="flex items-start gap-3 p-3 rounded-xl border border-sand-200 bg-white hover:border-teal-dark/30 hover:shadow-sm transition-all group cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {children}
      </div>
    </>
  );
}
