import * as fs from "node:fs";
import * as path from "node:path";
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

const localDir = process.argv[2];
const remoteDir = process.argv[3] || "/";

if (!localDir) {
  console.error(
    "Usage: npx tsx index.ts <local-directory> [remote-directory]"
  );
  console.error("Example: npx tsx index.ts ./uploads /backups");
  process.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey
);

const results: {
  localPath: string;
  remotePath: string;
  size: number;
  success: boolean;
  error?: string;
}[] = [];

async function uploadDirectory(localPath: string, remotePath: string) {
  const entries = fs.readdirSync(localPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryLocalPath = path.join(localPath, entry.name);
    const entryRemotePath = `${remotePath}/${entry.name}`;

    if (entry.isDirectory()) {
      await uploadDirectory(entryLocalPath, entryRemotePath);
    } else if (entry.isFile()) {
      try {
        const fileStats = fs.statSync(entryLocalPath);
        const nodeStream = fs.createReadStream(entryLocalPath);
        const stream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

        const success = await BunnyStorage.file.upload(
          storageZone,
          entryRemotePath,
          stream
        );

        results.push({
          localPath: entryLocalPath,
          remotePath: entryRemotePath,
          size: fileStats.size,
          success,
        });
      } catch (error) {
        results.push({
          localPath: entryLocalPath,
          remotePath: entryRemotePath,
          size: 0,
          success: false,
          error: (error as Error).message,
        });
      }
    }
  }
}

try {
  await uploadDirectory(localDir, remoteDir);

  console.log(
    JSON.stringify(
      {
        storageZone: zoneName,
        region,
        localDirectory: localDir,
        remoteDirectory: remoteDir,
        results,
        summary: {
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          totalSize: results
            .filter((r) => r.success)
            .reduce((sum, r) => sum + r.size, 0),
        },
      },
      null,
      2
    )
  );
} catch (error) {
  console.error("Error:", (error as Error).message);
  process.exit(1);
}
