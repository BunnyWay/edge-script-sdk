# HTMLRewriter Example (Node)

This example shows how to transform an origin's HTML response on the fly using
the [HTMLRewriter](https://docs.bunny.net/scripting/runtime/html-rewriter) API
inside a Bunny Edge Script. The script proxies a Pull Zone origin and:

- Rewrites every `http://` link to `https://`
- Injects a `<meta>` tag into `<head>` to mark the response as rewritten

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ installed
- A Bunny Pull Zone (for production deployment)

## Setup

Install dependencies:

```bash
npm install
```

Optional environment variables:

```bash
export ORIGIN_URL="https://example.com/"  # The origin you want to proxy locally
export PORT="8080"                         # Local port (defaults to 8080)
```

## Running Locally

```bash
npm start
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080) — the response is
fetched from `ORIGIN_URL`, transformed, and streamed back.

> `HTMLRewriter` is a runtime global on Bunny Edge Scripting but is not
> available in plain Node.js. Until a local runtime for the Bunny Edge
> Scripting platform is available, this example pulls in the
> [`htmlrewriter`](https://github.com/remorses/htmlrewriter) WASM polyfill
> and falls back to it when the global is missing. On the edge, the native
> global is used — the polyfill is a no-op there.

## Deploying to Bunny Edge

Push this script to a Bunny Edge Scripting project linked to a Pull Zone. On
the edge, `servePullZone()` automatically uses the Pull Zone's configured
origin instead of the `url` option.
