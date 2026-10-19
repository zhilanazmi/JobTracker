import { forwardRef, type ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

/**
 * Cmp · Button dari .pen: pill, clay-md, h sm36/md44/lg52, label 15/600.
 * Variant: primary / secondary / ghost / danger.
 * State: hover naik 2px ×1.15, pressed clay-pressed turun 1px,
 * disabled opacity 0.45 tanpa shadow, loading ikon loader-circle.
 */
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: "border-2 border-text-primary bg-accent text-white shadow-clay-md hover:bg-accent-strong",
  secondary: "border-2 border-text-primary bg-accent-soft text-accent-text shadow-clay-md",
  ghost: "border-2 border-text-primary bg-transparent text-accent-text",
  danger: "border-2 border-text-primary bg-danger text-text-primary shadow-clay-md",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[15px]",
  lg: "h-13 px-8 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, disabled, className = "", children, ...rest }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-md font-bold
          transition-[transform,box-shadow,background-color] duration-150
          ${variantClass[variant]} ${sizeClass[size]}
          ${variant !== "ghost" && !isDisabled ? "hover:-translate-y-0.5 hover:shadow-clay-lg active:translate-y-px active:shadow-clay-pressed" : ""}
          ${variant === "ghost" && !isDisabled ? "hover:bg-accent-soft active:shadow-clay-pressed" : ""}
          ${isDisabled ? "opacity-45 cursor-not-allowed shadow-none" : "cursor-pointer"}
          focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2
          ${className}`}
        {...rest}
      >
        {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
