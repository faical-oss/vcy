import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { revalidatableTagSchema } from "@/features/catalog/cache-tags";

const bodySchema = z.object({
  tags: z.array(revalidatableTagSchema).min(1).max(100),
  /** Drop the entries now instead of serving stale content while they refresh. */
  immediate: z.boolean().optional(),
});

function secretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * On-demand revalidation by cache tag, called server-to-server (webhook or scheduler; the trigger is not decided yet).
 * `POST /api/revalidate` with header `x-revalidate-secret` and body `{ "tags": ["hotel:amanpuri"] }`.
 * Without `REVALIDATE_SECRET` configured the endpoint is closed (401 for everyone). Never reads cookies.
 */
export async function POST(request: Request): Promise<Response> {
  if (!secretMatches(request.headers.get("x-revalidate-secret"), process.env.REVALIDATE_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "invalid_body" }, { status: 400 });

  const tags = [...new Set(parsed.data.tags)];
  for (const tag of tags) revalidateTag(tag, parsed.data.immediate ? { expire: 0 } : "max");
  return Response.json({ revalidated: tags });
}
