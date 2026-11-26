import type { LifestyleSlug } from "@/constants/routes";
import type { LifestylePageFixture } from "@/interfaces";
import { adventure } from "./adventure";
import { golf } from "./golf";
import { meditation } from "./meditation";
import { spa } from "./spa";
import { yoga } from "./yoga";

export { lifestylePackages, packageById } from "./packages";

/** The five Lifestyle Vacations pages, keyed by slug. TODO(cms): served by the CMS. */
export const lifestylePages: Readonly<Record<LifestyleSlug, LifestylePageFixture>> = { adventure, golf, meditation, spa, yoga };
