"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#111111]/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative bg-white border border-[#111111]/8 w-full max-w-lg max-h-[90vh] overflow-auto animate-[scale-in_0.2s_ease-out_both]",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#111111]/6">
            <h2
              className="text-base font-light text-[#111111]"
              style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-[#111111]/30 hover:text-[#111111] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
