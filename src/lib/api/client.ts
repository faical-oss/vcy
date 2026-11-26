import "server-only";
import type { ApiRequestOptions, IApiClient } from "@/interfaces";
import { getApiEnv } from "@/lib/env";
import { ApiError } from "./errors";

const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * One HTTP client for the Trip Fusion API. The version comes from config, so the
 * four API versions stay behind the IApiClient interface.
 * TODO: align the auth scheme with the API docs.
 */
export function createApiClient(): IApiClient {
  const env = getApiEnv();
  const base = env.TRIPFUSION_API_BASE_URL.replace(/\/+$/, "");

  async function request<T>(method: "GET" | "POST", path: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = new URL(`${base}/${env.TRIPFUSION_API_VERSION}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const hasBody = options.body !== undefined;
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.TRIPFUSION_API_KEY}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) throw new ApiError(response.status, path);
    return (await response.json()) as T;
  }

  return {
    get: (path, options) => request("GET", path, options),
    post: (path, options) => request("POST", path, options),
  };
}
