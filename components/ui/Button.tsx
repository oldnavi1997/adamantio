import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium uppercase tracking-[0.12em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-[#111111] text-white hover:bg-[#0a0a0a] active:scale-[0.98]",
      secondary:
        "bg-[#d4af37] text-[#111111] hover:bg-[#edd98a] active:scale-[0.98]",
      outline:
        "border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white active:scale-[0.98]",
      ghost:
        "text-[#111111] hover:bg-[#111111]/6 active:scale-[0.98]",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
    };

    const sizes = {
      sm: "px-4 py-2 text-[10px]",
      md: "px-5 py-2.5 text-[11px]",
      lg: "px-7 py-3.5 text-[11px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
