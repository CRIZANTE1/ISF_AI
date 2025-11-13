import { cn } from "../../utils/cn";
import { ButtonHTMLAttributes, forwardRef, ReactElement, isValidElement, cloneElement } from "react";
import { Link } from "react-router-dom";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-white text-black hover:bg-white/90": variant === "default",
        "border border-white/20 bg-transparent hover:bg-white/10 text-white": variant === "outline",
        "hover:bg-white/10 text-white": variant === "ghost",
        "text-white underline-offset-4 hover:underline": variant === "link",
        "h-10 px-4 py-2": size === "default",
        "h-9 rounded-md px-3": size === "sm",
        "h-11 rounded-md px-8": size === "lg",
        "h-10 w-10": size === "icon",
      },
      className
    );

    if (asChild && isValidElement(props.children)) {
      return cloneElement(props.children as ReactElement, {
        className: cn(baseClasses, (props.children as ReactElement).props?.className),
        ref,
      });
    }

    return (
      <button
        className={baseClasses}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

