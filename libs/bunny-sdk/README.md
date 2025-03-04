# @bunny.net/edge-script-sdk
---

<div align="center">
  <a href="https://bunny.net">
    <img src="https://github.com/BunnyWay/edge-script-sdk/blob/main/asset/bunny.png?raw=true" width="500" height="auto" alt="Bunny"/>
  </a>
</div>

# Bunny Edge Scripting SDK

This repository contains `@bunny.net/edgescript-sdk`, a library designed to simplify the development and testing of applications on the Bunny Edge Scripting platform. With this SDK, you can build, debug, and run scripts locally, then deploy them seamlessly to Bunny’s global edge network for production.

Under the hood, Bunny Edge Scripting is built on Deno, and includes a custom runtime that supports running scripts interchangeably in both local and Bunny edge environments. This SDK emulates that environment locally, letting you develop and test your scripts with confidence before deploying them.

> **Note:** While the Bunny runtime closely matches Deno and Node behaviors, some APIs may differ or be restricted due to the unique requirements of running applications in a serverless CDN-based environment.

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

This example sets up a local HTTP server using the Bunny Edge Scripting SDK. You can access the server at 127.0.0.1:8080 and observe the real-time request logs. This setup mimics the way Bunny's edge network handles requests, providing a consistent development experience.

### Parameter Explanation

- **`port`**: The port on which the server will listen for incoming HTTP requests. In this example, `8080` is specified, so you can access the server at [http://127.0.0.1:8080](http://127.0.0.1:8080).
  
- **`hostname`**: The hostname or IP address for the server. Here, `'127.0.0.1'` restricts the server to listen only on the local machine (localhost). To make it accessible over the network, you could set it to `'0.0.0.0'`, allowing other devices to connect to the server.

## 🚀 Deploying to Bunny Edge
After local development and testing, deploying to Bunny Edge Scripting is straightforward. Simply push your code to your Bunny Edge Scripting project’s GitHub repository, and it will be automatically deployed across Bunny’s global CDN.

Once deployed, Bunny’s serve function processes incoming requests through a connected Pull Zone, allowing your application to deliver data from the edge with maximum speed and minimal latency.

## 🚨 Error Handling and Logging
Bunny Edge Scripting includes built-in logging to support error tracking and observability. Use console.log, console.warn, and console.error statements within your code to monitor application flow, debug issues, and gather insights both locally and in deployment.
