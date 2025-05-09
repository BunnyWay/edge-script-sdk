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

### Quick Start

- [list](#listing-files)
- [delete](#remove-files-or-directory)
- [upload](#uploading-a-file)
- [download](#download-a-file)

#### Getting a file

When getting a file, you can either get the metadata of a file, or the content
of the file.

The metadata describe the file.

```typescript
import * as BunnyStorageSDK from "@bunny.net/storage-sdk";

let storageZone = BunnyStorageSDK.zone.connect_with_accesskey(BunnyStorageSDK.regions.StorageRegion.Falkenstein, "storage-zone-name", "token")
let obj = await BunnyStorageSDK.file.get(storageZone, "/my-folder/my-file");

/*
 * Here obj will be equal to something like this:
const obj = {
    Guid: '123',
    UserId: 'user1',
    LastChanged: '2023-01-01T00:00:00Z',
    DateCreated: '2022-01-01T00:00:00Z',
    StorageZoneName: 'test-zone',
    Path: '/test/path',
    ObjectName: 'test-file.txt',
    Length: 100,
    StorageZoneId: 1,
    IsDirectory: false,
    ServerId: 1,
    Checksum: 'abc123',
    ReplicatedZones: 'UK,NY',
    ContentType: 'text/plain',
    data: () => Promise<{
      stream: ReadableStream<Uint8Array>;
      response: Response;
      length?: number;
    }>,

};
*/
```

From this metadata, you can then download the file content by using `await obj.data()`.

#### Listing files

You can list and navigate accross your storage zone by using:

```typescript
let list = await BunnyStorageSDK.file.list(sz, "/");
```

This will give you a list of file Metadata you'll be able to navigate.

#### Uploading a file

To upload a file, we leverage **Streams** to upload files as it would allow you
to upload files without having the full stream of content available.

```typescript
export async function upload(storageZone: StorageZone.StorageZone, path: string, stream: ReadableStream<Uint8Array>, options?: UploadOptions): Promise<boolean>;
export async function upload(storageZone: StorageZone.StorageZone, path: string, stream: ReadableStream<Uint8Array>): Promise<boolean>;
export async function upload(storageZone: StorageZone.StorageZone, path: string, stream: ReadableStream<Uint8Array>, options?: UploadOptions): Promise<boolean>;

export type UploadOptions = {
  /**
   * The SHA256 Checksum associated to the data you want to send. If null then
   * the server will automatically calculate it.
   */
  sha256Checksum?: string;
  /**
   * You can override the content-type of the file you upload with this option.
   */
  contentType?: string;
};
```

Example:

```typescript
await BunnyStorageSDK.file.upload(sz, "/some-file", random_bytes_10kb);
```

#### Download a file

To downlaod a file, you have two choices, either you use this function to
download it directly.

```typescript
export async function download(storageZone: StorageZone.StorageZone, path: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  response: Response;
  length?: number;
}>;
```

Example:

```typescript
await BunnyStorageSDK.file.download(sz, "/some-file");
```

You'll have the stream of the content and the associated response and the length
if available.

You could also use the `data` function available in the File Metadata.

#### Remove files or directory


```typescript
export async function remove(storageZone: StorageZone.StorageZone, path: string): Promise<boolean>;
export async function removeDirectory(storageZone: StorageZone.StorageZone, path: string): Promise<boolean>;
```

Example:

```typescript
await BunnyStorageSDK.file.remove(sz, "/some-file");
```
