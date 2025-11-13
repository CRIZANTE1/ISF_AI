import { cn } from "../../utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black",
        {
          "bg-white text-black border-white": variant === "default",
          "border-white/50 text-white bg-transparent": variant === "outline",
          "bg-white/10 text-white border-white/30": variant === "secondary",
        },
        className
      )}
      {...props}
    />
  );
}

