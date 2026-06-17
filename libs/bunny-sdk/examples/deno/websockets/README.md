# WebSocket Example (Deno)

This example shows how to upgrade an HTTP request to a
[WebSocket](https://docs.bunny.net/scripting/websockets) connection inside a
Bunny Edge Script and run a simple echo server.

## Prerequisites

- [Deno](https://deno.land/) installed
- A Bunny Pull Zone with WebSockets enabled (for production deployment — see
  Pull Zone → General → WebSockets)

### Installing Deno

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex
```

## Setup

Optional environment variables:

```bash
export PORT="8080"  # Local port (defaults to 8080)
```

## Running Locally

```bash
deno task start
```

> Note: `request.upgradeWebSocket()` is a runtime API provided by the Bunny
> Edge Scripting environment. Plain Deno does not implement it, so the
> WebSocket upgrade only works once the script is deployed to Bunny. The
> server still starts locally and responds to non-WebSocket requests with a
> `426 Upgrade Required`.

## Testing After Deployment

Once deployed to a Pull Zone with WebSockets enabled, connect with any
WebSocket client (`websocat`, `wscat`, browser DevTools, etc.):

```bash
npx wscat -c wss://your-pullzone.b-cdn.net/
```

You should receive a `Welcome to Bunny Edge!` greeting on connect, and any
message you send back will be echoed with an `Echo:` prefix.

## Deploying to Bunny Edge

1. Push this script to a Bunny Edge Scripting project linked to a Pull Zone.
2. Enable WebSockets on the Pull Zone (General → WebSockets).
3. Connect with a `wss://` URL pointing at your Pull Zone hostname.

Connections auto-close after 2 minutes of inactivity regardless of the
`idleTimeout` option.
