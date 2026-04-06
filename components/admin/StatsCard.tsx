import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  accent?: boolean;
}

export function StatsCard({ title, value, icon, description, className, accent }: StatsCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-[#111111]/6 p-6 relative overflow-hidden",
        accent && "bg-[#111111]",
        className
      )}
    >
      {/* Top accent line */}
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#d4af37]" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[9px] font-medium uppercase tracking-[0.2em] mb-2",
              accent ? "text-white/50" : "text-[#111111]/40"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "text-2xl font-light truncate",
              accent ? "text-white" : "text-[#111111]"
            )}
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          >
            {value}
          </p>
          {description && (
            <p className={cn("text-[10px] mt-1.5", accent ? "text-white/35" : "text-[#111111]/30")}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex-shrink-0 w-9 h-9 flex items-center justify-center",
              accent ? "text-[#d4af37]" : "text-[#111111]/30"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
