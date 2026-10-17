import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-soft disabled:bg-faint",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-hover disabled:text-faint",
  ghost: "text-ink-soft hover:bg-hover hover:text-ink disabled:text-faint",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed",
        size === "md" ? "h-8 px-3 text-[13px]" : "h-7 px-2 text-xs",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
