/** Sign-up and log-in passwords must be at least this long (matches the original site's form). */
export const MIN_PASSWORD_LENGTH = 8;

/** Request header set by src/proxy.ts for /account routes so the server-side guard knows which page was asked for. */
export const ACCOUNT_PATH_HEADER = "x-account-path";
