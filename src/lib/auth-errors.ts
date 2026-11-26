import "server-only";

/** Thrown by getAuthService() when mocks are off and no real auth provider is wired yet. */
export class AuthNotConfiguredError extends Error {
  constructor() {
    super("Real auth not configured: set USE_MOCKS=true for dev login, or implement IAuthService for the chosen provider.");
    this.name = "AuthNotConfiguredError";
  }
}
