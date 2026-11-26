/** "4 results" line shown between the hero and the card grid. */
export function ResultsLine({ count }: { count: number }) {
  return (
    <p className="mb-6 text-sm text-body">
      {count} {count === 1 ? "result" : "results"}
    </p>
  );
}
