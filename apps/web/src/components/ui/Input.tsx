import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

/**
 * Input/Select/Textarea inset clay (resep MD): tertekan ke dalam
 * (clay-pressed), radius md, fokus = ring accent-soft + border accent.
 */

const INSET =
  "w-full rounded-md border-2 border-text-primary bg-surface px-4 text-[15px] text-text-primary " +
  "shadow-clay-pressed placeholder:text-text-muted " +
  "focus:outline-3 focus:outline-accent focus:ring-3 focus:ring-accent-soft " +
  "disabled:opacity-45 read-only:opacity-80";;

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...rest }, ref) => <input ref={ref} className={`${INSET} h-11 ${className}`} {...rest} />,
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", ...rest }, ref) => <select ref={ref} className={`${INSET} h-11 cursor-pointer ${className}`} {...rest} />,
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...rest }, ref) => <textarea ref={ref} className={`${INSET} min-h-24 py-3 ${className}`} {...rest} />,
);
Textarea.displayName = "Textarea";

/** Label 13/600 di atas input (spesifikasi Setup screen). */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-text-secondary">{label}</span>
      {children}
    </label>
  );
}
