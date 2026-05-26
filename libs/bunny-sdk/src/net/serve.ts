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

type MiddlewareLists = {
  onClientRequest: Array<
    (ctx: ClientRequestContext) => Promise<Request> | Promise<Response> | undefined
  >;
  onOriginRequest: Array<
    (ctx: OriginRequestContext) => Promise<Request> | Promise<Response> | undefined
  >;
  onOriginResponse: Array<
    (ctx: OriginResponseContext) => Promise<Response> | undefined
  >;
  onClientResponse: Array<
    (ctx: ClientResponseContext) => Promise<Response> | undefined
  >;
};

/**
 * Builds the local-dev pull-zone request handler. Exported for testing.
 * @internal
 */
export function internal_buildPullZoneHandler(
  originUrl: string,
  middlewares: MiddlewareLists,
  runtime: "node" | "deno" | "unknown" = "node",
): (req: Request) => Promise<Response> {
  const rebuildForNode = async (
    source: Response,
    headers: Headers,
  ): Promise<Response> => {
    const init: ResponseInit = {
      status: source.status,
      statusText: source.statusText,
      headers,
    };
    if (
      runtime === "node" &&
      headers.get("content-type") === "text/html" &&
      source.body !== null
    ) {
      const body = await source.text();
      headers.delete("content-encoding");
      return new Response(body, init);
    }
    return new Response(source.body, init);
  };

  return async (req) => {
    const url = new URL(req.url);
    const origin_url = new URL(originUrl);

    url.protocol = origin_url.protocol;
    url.hostname = origin_url.hostname;
    url.port = origin_url.port;

    let mutableRequest = new Request(url, req as unknown as RequestInit);

    for (const mid of middlewares.onClientRequest) {
      const reqOrResponse = await mid({ request: mutableRequest });
      if (isResponse(reqOrResponse)) {
        return reqOrResponse as Response;
      }
      if (isRequest(reqOrResponse)) {
        mutableRequest = reqOrResponse as Request;
      }
    }

    // TODO: Cache layer for local dev to simulate our global cache.

    let originResponse: Response | undefined;
    let originRequestShortCircuited = false;

    for (const mid of middlewares.onOriginRequest) {
      const reqOrResponse = await mid({ request: mutableRequest });
      if (isResponse(reqOrResponse)) {
        originResponse = reqOrResponse as Response;
        originRequestShortCircuited = true;
        break;
      }
      if (isRequest(reqOrResponse)) {
        mutableRequest = reqOrResponse as Request;
      }
    }

    if (originResponse === undefined) {
      originResponse = await fetch(mutableRequest);
    }

    const headers = new Headers();
    for (const [key, value] of originResponse.headers.entries()) {
      headers.set(key, value);
    }

    let newResponse = await rebuildForNode(originResponse, headers);

    if (!originRequestShortCircuited) {
      for (const mid of middlewares.onOriginResponse) {
        const reqOrResponse = await mid({
          request: mutableRequest,
          response: newResponse,
        });
        if (isResponse(reqOrResponse)) {
          newResponse = reqOrResponse as Response;
        }
      }
    }

    for (const mid of middlewares.onClientResponse) {
      const reqOrResponse = await mid({
        request: mutableRequest,
        response: newResponse,
      });
      if (isResponse(reqOrResponse)) {
        newResponse = reqOrResponse as Response;
      }
    }

    return newResponse;
  };
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

export type ClientRequestContext = {
  request: Request;
};

export type ClientResponseContext = {
  request: Request;
  response: Response;
};

export type PullZoneHandler = {
  /**
   * Add a Middleware for the requests being processed before origin fetch.
   */
  onOriginRequest: (
    middleware: (
      ctx: OriginRequestContext,
    ) => Promise<Request> | Promise<Response>,
  ) => PullZoneHandler;

  /**
   * Add a Middleware for the response being processed after origin fetch.
   */
  onOriginResponse: (
    middleware: (
      ctx: OriginResponseContext,
    ) => Promise<Response>,
  ) => PullZoneHandler;

  /**
   * Add a Middleware for the requests being processed before cache.
   */
  onClientRequest: (
    middleware: (
      ctx: ClientRequestContext,
    ) => Promise<Request> | Promise<Response>,
  ) => PullZoneHandler;

  /**
   * Add a Middleware for the response being processed after cache.
   */
  onClientResponse: (
    middleware: (
      ctx: ClientResponseContext,
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
  const onClientRequestMiddleware: Array<
    (
      ctx: ClientRequestContext,
    ) => Promise<Request> | Promise<Response> | undefined
  > = [];
  const onClientResponseMiddleware: Array<
    (
      ctx: ClientResponseContext,
    ) => Promise<Response> | undefined
  > = [];

  const platform = internal_getPlatform();

  switch (platform.runtime) {
    case "bunny": {
      Bunny.v1.registerMiddlewares({
        onOriginRequest: onOriginRequestMiddleware,
        onOriginResponse: onOriginResponseMiddleware,
        onClientRequest: onClientRequestMiddleware,
        onClientResponse: onClientResponseMiddleware,
      });
      break;
    }
    default: {
      const middlewareHandler = internal_buildPullZoneHandler(
        raw_options.url,
        {
          onClientRequest: onClientRequestMiddleware,
          onOriginRequest: onOriginRequestMiddleware,
          onOriginResponse: onOriginResponseMiddleware,
          onClientResponse: onClientResponseMiddleware,
        },
        platform.runtime === "node" ? "node" : "deno",
      );

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

  pullzoneHandler.onClientResponse = (middleware) => {
    onClientResponseMiddleware.push(middleware);
    return pullzoneHandler;
  };

  pullzoneHandler.onClientRequest = (middleware) => {
    onClientRequestMiddleware.push(middleware);
    return pullzoneHandler;
  };

  return pullzoneHandler;
}

export { serve, ServeHandler, servePullZone, ServerHandler };
