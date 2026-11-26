import { cn } from "@/helpers/cn";

export interface DestinationStat {
  label: string;
  value: string;
  /** Shows the value in the accent colour (the "From" price). */
  emphasis?: boolean;
}

/** Key facts of a destination as term/description pairs. Two columns on narrow screens, one row from `sm`. Renders nothing without facts. */
export function DestinationStats({ stats }: { stats: DestinationStat[] }) {
  if (stats.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 py-4 sm:flex sm:flex-wrap sm:gap-x-16">
      {stats.map(({ label, value, emphasis }) => (
        <div key={label} className="flex flex-col justify-center">
          <dt className="text-micro uppercase tracking-[0.25px] text-muted-blue">{label}</dt>
          <dd className={cn("mt-0.5 text-sm", emphasis ? "font-bold text-accent" : "font-medium text-primary")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
