import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/helpers/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Main call to action (gold). */
        primary: "rounded-full bg-accent text-accent-foreground hover:bg-accent/90",
        /** Secondary action (navy). */
        secondary: "rounded-full bg-primary text-primary-foreground hover:bg-primary/90",
        /** Bordered neutral, used in the header and on light surfaces. */
        outline: "rounded-full border border-border bg-card text-primary hover:bg-surface",
        /** Inline text action with arrow, e.g. "Visit the magazine". */
        link: "gap-1.5 border-b border-primary pb-px font-medium text-primary hover:border-primary/70 hover:text-primary/70",
      },
      size: {
        sm: "h-9 px-3 text-eyebrow uppercase",
        md: "h-9 px-6 text-eyebrow uppercase",
        lg: "h-11 px-8 text-sm",
        /** For `link` variant: no box. */
        inline: "h-auto px-0 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonStyleProps = VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonStyleProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/** Same look as Button but renders a Next.js <Link>. */
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
