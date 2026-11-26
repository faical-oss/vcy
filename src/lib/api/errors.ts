export class ApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string) {
    super(`API request failed with status ${status} for ${path}`);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}
