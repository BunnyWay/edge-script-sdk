<div align="center">
  <a href="https://bunny.net">
    <img src="https://github.com/BunnyWay/edge-script-sdk/blob/main/asset/bunny.png?raw=true" width="500" height="auto" alt="Bunny"/>
  </a>
</div>

# Bunny Edge SDK

This repository contains multiple libraries to work with Bunny:

- [@bunny.net/edgescript-sdk](./libs/bunny-sdk/): a library designed to simplify the development and testing of applications on the Bunny Edge Scripting platform. With this SDK, you can build, debug, and run scripts locally, then deploy them seamlessly to Bunny’s global edge network for production.
- [@bunny.net/storage-sdk](./libs/bunny-storage/): a library designed to help you interact with the
Bunny Storage, to store & access file efficiently accross our whole network.

## 🥕 Usage

With `@bunny.net/edgescript-sdk`, you can write scripts that run smoothly on Deno, Node, and within the bunny.net network. Below is a quick example to help you get started with setting up a local server. For additional examples and use cases, refer to the [examples folder](./example/).

### Hello World Example
```typescript
import * as BunnySDK from "@bunny.net/edgescript-sdk";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log("Starting server...");

BunnySDK.net.http.serve({ port: 8080, hostname: '127.0.0.1' }, async (req) => {
  console.log(`[INFO]: ${req.method} - ${req.url}`);
  await sleep(1000); // Simulate some processing delay
  return new Response("Hello, Bunny Edge!");
});
```

If you want more information, feel free to dive into each packages to check
associated examples and documentations.
