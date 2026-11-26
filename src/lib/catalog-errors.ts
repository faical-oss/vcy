import "server-only";

/** Thrown by getNavigationService()/getCatalogService() when mocks are off and no Trip Fusion client exists yet. */
export class CatalogNotConfiguredError extends Error {
  constructor() {
    super("Real navigation/catalog not configured: set USE_MOCKS=true, or implement INavigationService and ICatalogService against Trip Fusion.");
    this.name = "CatalogNotConfiguredError";
  }
}
