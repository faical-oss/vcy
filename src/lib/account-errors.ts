import "server-only";

/** Thrown by account services when there is no signed-in member. */
export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in.");
    this.name = "NotSignedInError";
  }
}
