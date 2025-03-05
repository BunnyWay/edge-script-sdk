# @bunny.net/storage-sdk
---

<div align="center">
  <a href="https://bunny.net">
    <img src="https://github.com/BunnyWay/edge-script-sdk/blob/main/asset/bunny.png?raw=true" width="500" height="auto" alt="Bunny"/>
  </a>
</div>


The `@bunny.net/storage-sdk` a library designed to help you interact with 
BunnyCDN Storage API.

# Bunny Storage SDK

This repository contains `@bunny.net/storage-sdk`, a library designed to simplify the usage of the BunnyCDN Storage API.

## 🥕 Usage

With `@bunny.net/storage-sdk`, you can interact with the BunnyCDN Storage API. Below is a quick example to help you get started with setting up a local server. For additional examples and use cases, refer to the [examples folder](/example/).

### Listing files on your Storage Zone
```typescript
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import * as BunnyStorageSDK from "@bunny.net/storage-sdk";

let sz_zone = process.env.STORAGE_ZONE!;
let access_key = process.env.STORAGE_ACCESS_KEY!;

let sz = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, sz_zone, access_key);

console.log("Starting server...");

BunnySDK.net.http.serve({ port: 8080, hostname: '127.0.0.1' }, async (req) => {
  let list = await BunnyStorageSDK.file.list(sz, "/");
  console.log(`[INFO]: ${req.method} - ${req.url}`);
  return new Response(JSON.stringify(list));
});
```

This example sets up a local HTTP server using the Bunny Edge Scripting SDK to list files on a Storage Zone using the BunnyCDN Storage SDK. You can access the server at 127.0.0.1:8080 and observe the real-time request logs.
