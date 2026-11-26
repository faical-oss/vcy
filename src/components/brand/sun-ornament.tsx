import { cn } from "@/helpers/cn";

/** Decorative sunrise ornament used above eyebrow labels. Color via text-* (default muted blue). */
export function SunOrnament({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 116 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.99"
      className={cn("h-7 w-[116px] text-muted-blue", className)}
    >
      <g>
        <path d="M62.3303 16.1351L68.9749 0.235649" />
        <path d="M66.3643 18.7452L74.9072 10.2022" />
        <path d="M40.4991 10.4396L48.9233 18.7452" />
        <path d="M69.0931 22.7795L82.5007 17.2029" />
        <path d="M46.1943 0.235649L53.0762 16.1351" />
        <path d="M57.5847 3.08326V15.3045" />
        <path d="M46.1946 22.7795L32.9055 17.3215" />
        <path d="M0.4 27.6H45.5C45.5 20.5 51.2 14.9 57.7 14.9C64.2 14.9 69.9 20.5 69.9 27.6H115" />
      </g>
    </svg>
  );
}
