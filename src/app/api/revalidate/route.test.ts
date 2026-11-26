import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag }));

import { POST } from "./route";

function call(body: unknown, secret?: string, raw?: string): Promise<Response> {
  return POST(
    new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json", ...(secret ? { "x-revalidate-secret": secret } : {}) },
      body: raw ?? JSON.stringify(body),
    }),
  );
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("REVALIDATE_SECRET", "s3cret-value");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects a missing or wrong secret without revalidating", async () => {
    expect((await call({ tags: ["catalog"] })).status).toBe(401);
    expect((await call({ tags: ["catalog"] }, "wrong")).status).toBe(401);
    expect((await call({ tags: ["catalog"] }, "s3cret-valu")).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("is closed when no secret is configured, even for an empty header match", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect((await call({ tags: ["catalog"] }, "")).status).toBe(401);
    expect((await call({ tags: ["catalog"] }, "anything")).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and invalid tags", async () => {
    expect((await call(null, "s3cret-value", "{not json")).status).toBe(400);
    expect((await call({ tags: [] }, "s3cret-value")).status).toBe(400);
    expect((await call({ tags: ["hotel:Bad Slug"] }, "s3cret-value")).status).toBe(400);
    expect((await call({ tags: ["anything-else"] }, "s3cret-value")).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates each distinct tag with stale-while-revalidate by default", async () => {
    const response = await call({ tags: ["hotel:amanpuri", "category:wellness-resorts", "hotel:amanpuri"] }, "s3cret-value");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revalidated: ["hotel:amanpuri", "category:wellness-resorts"] });
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenCalledWith("hotel:amanpuri", "max");
  });

  it("drops entries immediately when asked", async () => {
    await call({ tags: ["catalog"], immediate: true }, "s3cret-value");
    expect(revalidateTag).toHaveBeenCalledWith("catalog", { expire: 0 });
  });
});
