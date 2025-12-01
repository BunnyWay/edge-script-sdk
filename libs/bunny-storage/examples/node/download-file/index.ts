import * as fs from "node:fs";
import { Writable } from "node:stream";
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

const remotePath = process.argv[2];
const localPath = process.argv[3];

if (!remotePath || !localPath) {
  console.error("Usage: npx tsx index.ts <remote-path> <local-path>");
  console.error(
    "Example: npx tsx index.ts /folder/file.txt ./downloaded.txt"
  );
  process.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey
);

try {
  const { stream, length } = await BunnyStorage.file.download(
    storageZone,
    remotePath
  );

  const fileStream = fs.createWriteStream(localPath);
  const writableStream = Writable.toWeb(fileStream);
  await stream.pipeTo(writableStream);

  console.log(
    JSON.stringify(
      {
        storageZone: zoneName,
        region,
        remotePath,
        localPath,
        size: length,
        success: true,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error("Error downloading file:", (error as Error).message);
  process.exit(1);
}
