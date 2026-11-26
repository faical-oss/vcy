import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexingEnabled } from "@/lib/env";

// SITE_ENV is read at build time: build each environment with its own value.
export default function robots(): MetadataRoute.Robots {
  if (!isIndexingEnabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
