import { cn } from "@/helpers/cn";

/** Eyebrow label with a short rule: "—— BROWSE BY TYPE". */
export function SectionTag({
  children,
  className,
  tone = "muted",
  as: Tag = "p",
  id,
}: {
  children: string;
  className?: string;
  tone?: "muted" | "inverse";
  /** Element to render: a heading when the tag names a content group. */
  as?: "p" | "h2";
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "flex items-center gap-2 text-eyebrow font-semibold uppercase",
        tone === "muted" ? "text-muted-blue" : "text-white",
        className,
      )}
    >
      <span aria-hidden className="h-px w-4 bg-current" />
      {children}
    </Tag>
  );
}
