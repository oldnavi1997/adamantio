import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3.5 py-2.5 bg-white border text-sm text-[#111111] placeholder:text-[#111111]/25 focus:outline-none focus:border-[#d4af37] transition-colors duration-200",
            error ? "border-red-400" : "border-[#111111]/15",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-red-600 tracking-wide">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
