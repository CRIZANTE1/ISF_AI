import { cn } from "../../utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "default":
        return {
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderColor: 'var(--primary)',
        };
      case "outline":
        return {
          backgroundColor: 'transparent',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
        };
      case "secondary":
        return {
          backgroundColor: 'var(--secondary)',
          color: 'var(--secondary-foreground)',
          borderColor: 'var(--border)',
        };
      default:
        return {
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderColor: 'var(--primary)',
        };
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        className
      )}
      style={{
        ...getVariantStyles(),
        borderRadius: 'var(--radius)',
        focusRingColor: 'var(--ring)',
      }}
      {...props}
    />
  );
}

