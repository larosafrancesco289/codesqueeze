import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "link";
type Size = "sm" | "default" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 rounded-2xl text-sm",
  default: "h-10 px-4 rounded-2xl text-sm",
  lg: "h-11 px-8 rounded-2xl text-base",
  icon: "h-10 w-10 rounded-2xl",
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-black hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]",
  outline:
    "bg-transparent border border-border text-fg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]",
  ghost:
    "bg-transparent text-fg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]",
  link: "text-accent underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "primary", size = "default", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
