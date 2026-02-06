import * as fs from "node:fs";
import { Readable } from "node:stream";
import * as BunnyStorage from "@bunny.net/storage-sdk";

const apiKey = process.env.BUNNY_STORAGE_API_KEY;
const zoneName = process.env.BUNNY_STORAGE_ZONE;
const region = process.env.BUNNY_STORAGE_REGION || "de";

if (!apiKey || !zoneName) {
  console.error("Missing required environment variables:");
  console.error("  BUNNY_STORAGE_API_KEY - Your storage zone API key");
  console.error("  BUNNY_STORAGE_ZONE - Your storage zone name");
  process.exit(1);
}

const localPath = process.argv[2];
const remotePath = process.argv[3];

if (!localPath || !remotePath) {
  console.error("Usage: npx tsx index.ts <local-path> <remote-path>");
  console.error("Example: npx tsx index.ts ./file.txt /folder/file.txt");
  process.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey
);

try {
  const fileStats = fs.statSync(localPath);
  const nodeStream = fs.createReadStream(localPath);
  const stream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  const success = await BunnyStorage.file.upload(storageZone, remotePath, stream);

  console.log(
    JSON.stringify(
      {
        storageZone: zoneName,
        region,
        localPath,
        remotePath,
        size: fileStats.size,
        success,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error("Error uploading file:", (error as Error).message);
  process.exit(1);
}
