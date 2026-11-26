import type { INavigationService } from "@/interfaces";
import { navigationFixture } from "../fixtures/navigation";

export const mockNavigationService: INavigationService = {
  async getNavigation() {
    return navigationFixture;
  },
};
