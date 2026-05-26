import { internal_buildPullZoneHandler } from "./serve.ts";

type Order = string[];

function makeOriginResponse(body = "origin-body", init: ResponseInit = {}): Response {
  return new Response(body, init);
}

describe("internal_buildPullZoneHandler", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("passes through to origin when no middlewares registered", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse("hello"));

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [],
      onOriginRequest: [],
      onOriginResponse: [],
      onClientResponse: [],
    });

    const res = await handler(new Request("http://localhost/path"));

    expect(await res.text()).toBe("hello");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetched = (global.fetch as jest.Mock).mock.calls[0][0] as Request;
    expect(new URL(fetched.url).hostname).toBe("origin.test");
    expect(new URL(fetched.url).pathname).toBe("/path");
  });

  test("rewrites incoming URL to use origin host", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse());

    const handler = internal_buildPullZoneHandler("https://origin.test:8443", {
      onClientRequest: [],
      onOriginRequest: [],
      onOriginResponse: [],
      onClientResponse: [],
    });

    await handler(new Request("http://localhost:1234/a/b?c=1"));

    const fetched = (global.fetch as jest.Mock).mock.calls[0][0] as Request;
    const url = new URL(fetched.url);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("origin.test");
    expect(url.port).toBe("8443");
    expect(url.pathname).toBe("/a/b");
    expect(url.searchParams.get("c")).toBe("1");
  });

  test("middlewares execute in order: clientReq → originReq → originRes → clientRes", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse());
    const order: Order = [];

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [
        async (ctx) => {
          order.push("clientReq");
          return ctx.request;
        },
      ],
      onOriginRequest: [
        async (ctx) => {
          order.push("originReq");
          return ctx.request;
        },
      ],
      onOriginResponse: [
        async (ctx) => {
          order.push("originRes");
          return ctx.response;
        },
      ],
      onClientResponse: [
        async (ctx) => {
          order.push("clientRes");
          return ctx.response;
        },
      ],
    });

    await handler(new Request("http://localhost/"));

    expect(order).toEqual(["clientReq", "originReq", "originRes", "clientRes"]);
  });

  test("onClientRequest can mutate the request before origin sees it", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse());

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [
        async (ctx) => {
          const headers = new Headers(ctx.request.headers);
          headers.set("x-trace", "client");
          return new Request(ctx.request, { headers });
        },
      ],
      onOriginRequest: [],
      onOriginResponse: [],
      onClientResponse: [],
    });

    await handler(new Request("http://localhost/"));

    const fetched = (global.fetch as jest.Mock).mock.calls[0][0] as Request;
    expect(fetched.headers.get("x-trace")).toBe("client");
  });

  test("onClientRequest returning a Response short-circuits entire pipeline", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse());
    const order: Order = [];

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [
        async () => {
          order.push("clientReq");
          return new Response("blocked", { status: 403 });
        },
      ],
      onOriginRequest: [async (ctx) => { order.push("originReq"); return ctx.request; }],
      onOriginResponse: [async (ctx) => { order.push("originRes"); return ctx.response; }],
      onClientResponse: [async (ctx) => { order.push("clientRes"); return ctx.response; }],
    });

    const res = await handler(new Request("http://localhost/"));

    expect(res.status).toBe(403);
    expect(await res.text()).toBe("blocked");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(order).toEqual(["clientReq"]);
  });

  test("onOriginRequest can mutate the request before fetch", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse());

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [],
      onOriginRequest: [
        async (ctx) => {
          const headers = new Headers(ctx.request.headers);
          headers.set("x-trace", "origin");
          return new Request(ctx.request, { headers });
        },
      ],
      onOriginResponse: [],
      onClientResponse: [],
    });

    await handler(new Request("http://localhost/"));

    const fetched = (global.fetch as jest.Mock).mock.calls[0][0] as Request;
    expect(fetched.headers.get("x-trace")).toBe("origin");
  });

  test("onOriginRequest returning a Response skips fetch and onOriginResponse, but runs onClientResponse", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse());
    const order: Order = [];

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [],
      onOriginRequest: [
        async () => {
          order.push("originReq");
          return new Response("from-origin-mw", { status: 201 });
        },
      ],
      onOriginResponse: [async (ctx) => { order.push("originRes"); return ctx.response; }],
      onClientResponse: [
        async (ctx) => {
          order.push("clientRes");
          const headers = new Headers(ctx.response.headers);
          headers.set("x-via", "client-mw");
          return new Response(ctx.response.body, {
            status: ctx.response.status,
            statusText: ctx.response.statusText,
            headers,
          });
        },
      ],
    });

    const res = await handler(new Request("http://localhost/"));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(order).toEqual(["originReq", "clientRes"]);
    expect(res.status).toBe(201);
    expect(res.headers.get("x-via")).toBe("client-mw");
    expect(await res.text()).toBe("from-origin-mw");
  });

  test("onOriginResponse can rewrite the response from origin", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse("original"));

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [],
      onOriginRequest: [],
      onOriginResponse: [
        async () => new Response("rewritten", { status: 200 }),
      ],
      onClientResponse: [],
    });

    const res = await handler(new Request("http://localhost/"));
    expect(await res.text()).toBe("rewritten");
  });

  test("onClientResponse is the final stage and its return reaches the client", async () => {
    global.fetch = jest.fn(async () => makeOriginResponse("origin"));

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [],
      onOriginRequest: [],
      onOriginResponse: [
        async () => new Response("from-origin-res", { status: 200 }),
      ],
      onClientResponse: [
        async () => new Response("from-client-res", { status: 202 }),
      ],
    });

    const res = await handler(new Request("http://localhost/"));
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("from-client-res");
  });

  test("multiple middlewares at the same stage execute in registration order and chain mutations", async () => {
    global.fetch = jest.fn(async (input: string | URL | Request) => {
      const req = input as Request;
      return new Response(req.headers.get("x-trace") ?? "");
    });

    const handler = internal_buildPullZoneHandler("https://origin.test", {
      onClientRequest: [
        async (ctx) => {
          const headers = new Headers(ctx.request.headers);
          headers.set("x-trace", "a");
          return new Request(ctx.request, { headers });
        },
        async (ctx) => {
          const headers = new Headers(ctx.request.headers);
          headers.set("x-trace", `${ctx.request.headers.get("x-trace")}-b`);
          return new Request(ctx.request, { headers });
        },
      ],
      onOriginRequest: [],
      onOriginResponse: [],
      onClientResponse: [],
    });

    const res = await handler(new Request("http://localhost/"));
    expect(await res.text()).toBe("a-b");
  });

  test("on node runtime, strips content-encoding for text/html responses", async () => {
    global.fetch = jest.fn(async () => {
      return new Response("<html>hi</html>", {
        headers: {
          "content-type": "text/html",
          "content-encoding": "gzip",
        },
      });
    });

    const handler = internal_buildPullZoneHandler(
      "https://origin.test",
      {
        onClientRequest: [],
        onOriginRequest: [],
        onOriginResponse: [],
        onClientResponse: [],
      },
      "node",
    );

    const res = await handler(new Request("http://localhost/"));
    expect(res.headers.get("content-encoding")).toBeNull();
    expect(res.headers.get("content-type")).toBe("text/html");
    expect(await res.text()).toBe("<html>hi</html>");
  });

  test("on non-node runtime, preserves content-encoding header", async () => {
    global.fetch = jest.fn(async () => {
      return new Response("body", {
        headers: {
          "content-type": "text/html",
          "content-encoding": "gzip",
        },
      });
    });

    const handler = internal_buildPullZoneHandler(
      "https://origin.test",
      {
        onClientRequest: [],
        onOriginRequest: [],
        onOriginResponse: [],
        onClientResponse: [],
      },
      "deno",
    );

    const res = await handler(new Request("http://localhost/"));
    expect(res.headers.get("content-encoding")).toBe("gzip");
  });
});
