/**
 * Networking Primitives for the HTTP(s) protocol.
 *
 * @packageDocumentation
 */
import { internal_getPlatform } from "../platform.ts";
import * as NodeImpl from "./_impl/node/serve.ts";
import { TcpListener } from "./tcp.ts";
import * as Tcp from "./tcp.ts";
import * as Ip from "./ip.ts";
import * as SocketAddr from "./socket_addr.ts";

function isResponse(value: unknown) {
  return value instanceof Response;
}

function isRequest(value: unknown) {
  return value instanceof Request;
}

/**
 * A handler for HTTP Requests.
 * Consumes a request and return a response.
 */
type ServerHandler = (request: Request) => Response | Promise<Response>;

type ServeHandler = {} & unknown;

function is_port_and_hostname(
  value: unknown,
): value is { port: number; hostname: string } {
  if (typeof value === "object" && value !== null) {
    const port = value["port"];
    return port !== undefined && typeof port === "number" &&
      value["hostname"] !== undefined;
  }

  return false;
}

/**
 * Serves HTTP requests with the provided handler.
 *
 * @example
 * ```ts
 * import * as BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk@0.11";
 *
 * console.log("Starting server...");
 * BunnySDK.net.http.serve(async (req) => {
 *   console.log(`[INFO]: ${req.method} - ${req.url}`);
 *   return new Response("Hello bunny!");
 * });
 * ```
 */
function serve(handler: ServerHandler): ServeHandler;
function serve(
  listener: { port: number; hostname: string },
  handler: ServerHandler,
): ServeHandler;
function serve(listener: TcpListener, handler: ServerHandler): ServeHandler;
function serve(
  listener: ServerHandler | { port: number; hostname: string } | TcpListener,
  handler?: ServerHandler,
): ServeHandler {
  let raw_handler: ServerHandler | undefined;
  let raw_listener: TcpListener;

  if (is_port_and_hostname(listener)) {
    const addr = SocketAddr.v4.tryFromString(
      `${listener.hostname}:${listener.port}`,
    );
    if (addr instanceof Error) {
      throw addr;
    }
    raw_listener = Tcp.bind(addr);
    raw_handler = handler;
  } else if (Tcp.isTcpListener(listener)) {
    raw_handler = handler;
    raw_listener = listener;
  } else {
    raw_handler = listener;
    raw_listener = Tcp.unstable_new();
  }

  if (raw_handler === undefined) {
    throw new Error("An issue happened.");
  }

  const platform = internal_getPlatform();

  switch (platform.runtime) {
    case "bunny": {
      Bunny.v1.serve(raw_handler);
      return {};
    }
    case "node": {
      return NodeImpl.node_serve(raw_listener, raw_handler);
    }

    case "deno": {
      const addr = Tcp.unstable_local_addr(raw_listener);

      if (!SocketAddr.isV4(addr)) {
        throw new Error("An issue happened with the addr.");
      }

      const port = SocketAddr.v4.port(addr);
      const hostname = Ip.toString(SocketAddr.v4.ip(addr));

      Deno.serve({ port, hostname }, raw_handler);
      return {};
    }
    case "unknown": {
      return {};
    }
  }
}

export type PullZoneHandlerOptions = {
  url: string;
};

export type OriginRequestContext = {
  request: Request;
};

export type OriginResponseContext = {
  request: Request;
  response: Response;
};

export type PullZoneHandler = {
  /**
   * Add a Middleware for the requests being processed.
   */
  onOriginRequest: (
    middleware: (
      ctx: OriginRequestContext,
    ) => Promise<Request> | Promise<Response>,
  ) => PullZoneHandler;

  /**
   * Add a Middleware for the response being processed.
   */
  onOriginResponse: (
    middleware: (
      ctx: OriginResponseContext,
    ) => Promise<Response>,
  ) => PullZoneHandler;
};

/**
 * Serves HTTP requests for a PullZone
 *
 * If you have an associated PullZone within Bunny, we'll use it on production
 * and for local development you can configure it with the `url` option.
 *
 * @example
 * ```ts
 * import BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk@0.11.2";
 *
 * console.log("Starting server...");
 *
 * BunnySDK.net.http.servePullZone({ url: "https://echo.free.beeceptor.com/" })
 *   .onOriginRequest(
 *     (ctx) => {
 *       const optFT = ctx.request.headers.get("feature-flags");
 *       const featureFlags = optFT
 *         ? optFT.split(",").map((v) => v.trimStart())
 *         : [];
 *
 *       // Route-based matching and feature flag check
 *       const path = new URL(ctx.request.url).pathname;
 *       if (path === "/d") {
 *         if (!featureFlags.includes("route-d-preview")) {
 *           return Promise.resolve(
 *             new Response("You cannot use this route.", { status: 400 }),
 *           );
 *         }
 *       }
 *
 *       return Promise.resolve(ctx.request);
 *     },
 *   ).onOriginResponse((ctx) => {
 *     const response = ctx.response;
 *     response.headers.append("Via", "Custom");
 *
 *     return Promise.resolve(response);
 *   });
 * ```
 */
function servePullZone(options?: PullZoneHandlerOptions): PullZoneHandler;
function servePullZone(
  listener: { port: number; hostname: string },
  options: PullZoneHandlerOptions,
): PullZoneHandler;
function servePullZone(
  listener: TcpListener,
  options: PullZoneHandlerOptions,
): PullZoneHandler;
function servePullZone(
  listener?:
    | PullZoneHandlerOptions
    | { port: number; hostname: string }
    | TcpListener,
  options?: PullZoneHandlerOptions,
): PullZoneHandler {
  let raw_listener: TcpListener;
  let raw_options: PullZoneHandlerOptions = {
    url: "https://bunny.net",
  };

  if (options) {
    raw_options = options;
  }

  if (is_port_and_hostname(listener)) {
    const addr = SocketAddr.v4.tryFromString(
      `${listener.hostname}:${listener.port}`,
    );
    if (addr instanceof Error) {
      throw addr;
    }
    raw_listener = Tcp.bind(addr);
  } else if (Tcp.isTcpListener(listener)) {
    raw_listener = listener;
  } else {
    if (listener) {
      raw_options = listener;
    }
    raw_listener = Tcp.unstable_new();
  }

  const onOriginRequestMiddleware: Array<
    (
      ctx: OriginRequestContext,
    ) => Promise<Request> | Promise<Response> | undefined
  > = [];
  const onOriginResponseMiddleware: Array<
    (
      ctx: OriginResponseContext,
    ) => Promise<Response> | undefined
  > = [];

  const platform = internal_getPlatform();

  switch (platform.runtime) {
    case "bunny": {
      Bunny.v1.registerMiddlewares({
        onOriginRequest: onOriginRequestMiddleware,
        onOriginResponse: onOriginResponseMiddleware,
      });
      break;
    }
    default: {
      const middlewareHandler: ServerHandler = async (req) => {
        const url = new URL(req.url);
        const origin_url = new URL(raw_options.url);

        url.protocol = origin_url.protocol;
        url.hostname = origin_url.hostname;
        url.port = origin_url.port;

        let mutableRequest = new Request(
          url,
          req as unknown as RequestInit,
        );

        // Request Middleware
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, mid] of onOriginRequestMiddleware.entries()) {
          const reqOrResponse = await mid({ request: mutableRequest });
          if (isResponse(reqOrResponse)) {
            return reqOrResponse;
          }
          if (isRequest(reqOrResponse)) {
            mutableRequest = reqOrResponse;
          }
        }

        const prevResponse = await fetch(mutableRequest);

        const headers = new Headers();
        for (const [key, value] of prevResponse.headers.entries()) {
          headers.set(key, value);
        }

        let response: Response;

        // Only for node
        switch (platform.runtime) {
          case "node": {
            if (
              headers.get("content-type") === "text/html" &&
              prevResponse.body !== null
            ) {
              const body = await prevResponse.text();
              headers.delete("content-encoding");
              response = new Response(body, { headers });
            } else {
              response = new Response(prevResponse.body, {
                ...prevResponse,
                headers,
              });
            }

            break;
          }
          default: {
            response = new Response(prevResponse.body, {
              ...prevResponse,
              headers,
            });
          }
        }

        // Response Middleware
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, mid] of onOriginResponseMiddleware.entries()) {
          const reqOrResponse = await mid({
            request: mutableRequest,
            response,
          });
          if (isResponse(reqOrResponse)) {
            response = reqOrResponse;
          }
        }

        return response;
      };

      serve(raw_listener, middlewareHandler);
    }
  }

  const pullzoneHandler = ({}) as PullZoneHandler;

  pullzoneHandler.onOriginResponse = (middleware) => {
    onOriginResponseMiddleware.push(middleware);
    return pullzoneHandler;
  };

  pullzoneHandler.onOriginRequest = (middleware) => {
    onOriginRequestMiddleware.push(middleware);
    return pullzoneHandler;
  };

  return pullzoneHandler;
}

export { serve, ServeHandler, servePullZone, ServerHandler };
