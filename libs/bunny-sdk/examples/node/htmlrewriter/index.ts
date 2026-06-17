import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { HTMLRewriter as HTMLRewriterPolyfill } from "htmlrewriter";

// Use the Bunny Edge runtime's native HTMLRewriter when available, and fall
// back to the WASM polyfill for local development.
const Rewriter: typeof HTMLRewriterPolyfill =
  (globalThis as { HTMLRewriter?: typeof HTMLRewriterPolyfill }).HTMLRewriter ??
  HTMLRewriterPolyfill;

const originUrl = process.env.ORIGIN_URL || "https://example.com/";
const port = parseInt(process.env.PORT || "8080", 10);

console.log(`Starting HTMLRewriter server on :${port} (origin: ${originUrl})`);

BunnySDK.net.http
  .servePullZone({ port, hostname: "127.0.0.1" }, { url: originUrl })
  .onOriginResponse(async (ctx) => {
    const contentType = ctx.response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return ctx.response;
    }

    const rewriter = new Rewriter()
      .on("a[href]", {
        element(el) {
          const href = el.getAttribute("href");
          if (href?.startsWith("http://")) {
            el.setAttribute("href", href.replace("http://", "https://"));
          }
        },
      })
      .on("head", {
        element(el) {
          el.append(
            '<meta name="x-rewritten-by" content="bunny-edge-script">',
            { html: true }
          );
        },
      });

    return rewriter.transform(ctx.response);
  });
