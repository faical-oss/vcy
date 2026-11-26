import type { ComponentProps } from "react";
import { cn } from "@/helpers/cn";

type SwitchProps = Omit<ComponentProps<"button">, "role" | "onChange" | "children"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** On/off switch (role="switch"). Takes effect immediately; the label comes from aria-label / aria-labelledby. */
export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors disabled:opacity-50 motion-reduce:transition-none",
        "before:absolute before:-inset-2 before:content-['']",
        checked ? "bg-primary" : "bg-border-strong",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "block size-5 rounded-full bg-card shadow-sm transition-transform motion-reduce:transition-none",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
