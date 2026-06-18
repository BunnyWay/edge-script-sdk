// Type-level tests for the middleware signatures on `servePullZone`.
// The callbacks below are typechecked but never invoked — these
// exist purely to ensure the public signatures accept all the shapes
// documented in the JSDoc. If any stop typechecking, it's a regression.

import type * as Http from "./serve.ts";

type OnRequest = Parameters<Http.PullZoneHandler["onOriginRequest"]>[0];
type OnResponse = Parameters<Http.PullZoneHandler["onOriginResponse"]>[0];

// Async arrow with mixed Request / Response returns — async-flattening
// produces `Promise<Request | Response>`. Used to fail under the previous
// `Promise<Request> | Promise<Response>` signature.
const _asyncMixed: OnRequest = async (ctx) => {
  if (ctx.request.headers.get("upgrade") === "websocket") {
    return new Response(null, { status: 426 });
  }
  return new Request(ctx.request);
};

// Plain function returning `Promise.resolve(...)` — the classic workaround.
const _promiseResolve: OnRequest = (ctx) => {
  if (ctx.request.headers.get("x-block") === "1") {
    return Promise.resolve(new Response(null, { status: 403 }));
  }
  return Promise.resolve(new Request(ctx.request));
};

// Sync returns — mirrors the `ServerHandler` pattern.
const _sync: OnRequest = (ctx) => {
  if (ctx.request.headers.get("x-fast-path") === "1") {
    return new Response("ok");
  }
  return new Request(ctx.request);
};

// `onOriginResponse` accepts sync and async too.
const _resSync: OnResponse = (ctx) => ctx.response;
const _resAsync: OnResponse = async (ctx) => {
  ctx.response.headers.set("Via", "Custom");
  return ctx.response;
};

test("middleware type signatures accept sync, async, and mixed returns", () => {
  // Silence unused-var warnings; the real check is at compile time.
  expect(typeof _asyncMixed).toBe("function");
  expect(typeof _promiseResolve).toBe("function");
  expect(typeof _sync).toBe("function");
  expect(typeof _resSync).toBe("function");
  expect(typeof _resAsync).toBe("function");
});
