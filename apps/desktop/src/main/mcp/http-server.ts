import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { handleMcpMessage, isToolProfileName, type McpToolProvider, type ServerInfo, type JsonRpcMessage } from "./core";
import { MCP_PROTOCOL_PATH } from "../../shared/mcp";

const MAX_BODY_BYTES = 4 * 1024 * 1024;

class BodyTooLargeError extends Error {}

export interface HttpServerOptions {
  /** Read live so a rotated token takes effect without restarting the server. */
  readonly getToken: () => string;
  readonly provider: McpToolProvider;
  readonly serverInfo: ServerInfo;
  readonly host?: string;
  /** Extra interfaces to listen on with the same handler (e.g. Tailscale IP). */
  readonly extraHosts?: string[];
  readonly port?: number;
  /** Sticky tool profile, read live so set_tool_profile shows on /health. */
  readonly getProfile?: () => string;
}

export interface RunningHttpServer {
  readonly server: Server;
  readonly port: number;
  readonly host: string;
  readonly extraServers: Server[];
}

export interface HealthResponse {
  readonly ok: true;
  readonly service: "openreel";
  readonly version: string;
  readonly protocolPath: "/mcp";
  readonly port: number;
  readonly bind: "loopback" | "extra";
  readonly profile: string;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new BodyTooLargeError("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function bearerToken(req: IncomingMessage): string | null {
  const header = req.headers["authorization"];
  if (typeof header !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

function tokenMatches(provided: string | null, expected: string): boolean {
  if (provided === null || expected.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handleRpcPayload(
  raw: string,
  provider: McpToolProvider,
  serverInfo: ServerInfo,
  profile?: string,
): Promise<unknown> {
  const parsed = JSON.parse(raw) as JsonRpcMessage | JsonRpcMessage[];
  if (Array.isArray(parsed)) {
    const responses = await Promise.all(
      parsed.map((m) => handleMcpMessage(m, provider, serverInfo, { profile })),
    );
    return responses.filter((r) => r !== null);
  }
  return handleMcpMessage(parsed, provider, serverInfo, { profile });
}

/** Profile for one request: header override, else the sticky profile. */
function requestProfile(
  req: IncomingMessage,
  getProfile?: () => string,
): string | undefined {
  const header = req.headers["x-openreel-tool-profile"];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value === "string" && value.length > 0) return value;
  const sticky = getProfile?.();
  return typeof sticky === "string" && sticky.length > 0 ? sticky : undefined;
}

export function startHttpServer(
  options: HttpServerOptions,
): Promise<RunningHttpServer> {
  const host = options.host ?? "127.0.0.1";
  const makeHandler =
    (bind: "loopback" | "extra", self: () => Server) =>
    (req: IncomingMessage, res: ServerResponse) => {
      void (async () => {
        const url = new URL(req.url ?? "/", "http://localhost");
        // Unauthenticated health check. Answers without a token and without
        // leaking project data; never touches tools, the renderer, or files.
        if (url.pathname === "/health") {
          if (req.method !== "GET") {
            sendJson(res, 405, { error: "Method not allowed" });
            return;
          }
          const address = self().address();
          const port =
            typeof address === "object" && address ? address.port : 0;
          const profile = options.getProfile?.() ?? "editorial";
          const body: HealthResponse = {
            ok: true,
            service: "openreel",
            version: options.serverInfo.version,
            protocolPath: MCP_PROTOCOL_PATH,
            port,
            bind,
            profile: isToolProfileName(profile) ? profile : "editorial",
          };
          sendJson(res, 200, body);
          return;
        }
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }
        if (!tokenMatches(bearerToken(req), options.getToken())) {
          sendJson(res, 401, { error: "Unauthorized" });
          return;
        }
        try {
          const body = await readBody(req);
          if (!body) {
            sendJson(res, 400, { error: "Empty request body" });
            return;
          }
          const response = await handleRpcPayload(
            body,
            options.provider,
            options.serverInfo,
            requestProfile(req, options.getProfile),
          );
          if (response === null || (Array.isArray(response) && response.length === 0)) {
            res.writeHead(202).end();
            return;
          }
          sendJson(res, 200, response);
        } catch (error) {
          if (error instanceof BodyTooLargeError) {
            if (!res.headersSent) sendJson(res, 413, { error: "Request body too large" });
            return;
          }
          // SyntaxError = malformed JSON → JSON-RPC parse error; anything else is a
          // generic bad request.
          const isParse = error instanceof SyntaxError;
          const message = error instanceof Error ? error.message : "Bad request";
          sendJson(res, 400, {
            jsonrpc: "2.0",
            id: null,
            error: { code: isParse ? -32700 : -32600, message },
          });
        }
      })();
    };
  let server: Server;
  server = createServer(makeHandler("loopback", () => server));

  return new Promise((resolve, reject) => {
    const extraHosts = options.extraHosts ?? [];
    const listen = (
      target: Server,
      listenHost: string,
    ): Promise<void> =>
      new Promise((res, rej) => {
        target.once("error", rej);
        target.listen(options.port ?? 0, listenHost, () => {
          target.removeListener("error", rej);
          res();
        });
      });
    void (async () => {
      try {
        await listen(server, host);
      } catch (error) {
        reject(error);
        return;
      }
      // The extra interface never falls back to 0.0.0.0: if it fails,
      // log and keep the loopback listener.
      const extraServers: Server[] = [];
      for (const extraHost of extraHosts) {
        let extra: Server | undefined;
        extra = createServer(makeHandler("extra", () => extra as Server));
        try {
          await listen(extra, extraHost);
          extraServers.push(extra);
        } catch (error) {
          console.error(`[mcp] extra bind ${extraHost} failed: ${error instanceof Error ? error.message : String(error)}`);
          extra.removeAllListeners();
        }
      }
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ server, port, host, extraServers });
    })();
  });
}
