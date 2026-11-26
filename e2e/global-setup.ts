import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/*
 * Starts the built server once for the whole e2e suite and stops only that child process. It needs a production build
 * (`npm run build`). Port: E2E_PORT (default 3199). Set E2E_BASE_URL to test an already running server instead.
 * The tests read the base URL from process.env.E2E_BASE_URL, which this sets before the test workers start.
 * The child runs with NODE_ENV=production: vitest sets NODE_ENV=test, and `next start` under NODE_ENV=test adds a second
 * `<meta name="robots" content="noindex">` to every page, which is not what a real production server sends.
 */
const root = path.resolve(import.meta.dirname, "..");
let server: ChildProcess | undefined;

async function isUp(url: string): Promise<boolean> {
  return fetch(url).then(() => true, () => false);
}

export async function setup(): Promise<void> {
  if (process.env.E2E_BASE_URL) return;
  const port = Number(process.env.E2E_PORT ?? 3199);
  if (port === Number(process.env.PW_PORT ?? 3001)) throw new Error(`E2E_PORT ${port} is the Playwright port (PW_PORT): use a different one.`);
  const baseUrl = `http://127.0.0.1:${port}`;
  if (!existsSync(path.join(root, ".next/BUILD_ID"))) throw new Error("No production build found: run `npm run build` first.");
  if (await isUp(baseUrl)) throw new Error(`Port ${port} is already in use: set E2E_PORT to a free port.`);
  server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(port), "-H", "127.0.0.1"], { cwd: root, stdio: "ignore", env: { ...process.env, NODE_ENV: "production" } });
  const deadline = Date.now() + 40_000;
  while (!(await isUp(baseUrl))) {
    if (Date.now() > deadline) throw new Error(`server did not start at ${baseUrl}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  process.env.E2E_BASE_URL = baseUrl;
}

export function teardown(): void {
  server?.kill("SIGTERM");
}
