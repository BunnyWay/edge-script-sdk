import * as BunnyStorage from "@bunny.net/storage-sdk";

const apiKey = Deno.env.get("BUNNY_STORAGE_API_KEY");
const zoneName = Deno.env.get("BUNNY_STORAGE_ZONE");
const region = Deno.env.get("BUNNY_STORAGE_REGION") || "de";

if (!apiKey || !zoneName) {
  console.error("Missing required environment variables:");
  console.error("  BUNNY_STORAGE_API_KEY - Your storage zone API key");
  console.error("  BUNNY_STORAGE_ZONE - Your storage zone name");
  Deno.exit(1);
}

const localDir = Deno.args[0];
const remoteDir = Deno.args[1] || "/";

if (!localDir) {
  console.error(
    "Usage: deno run --allow-net --allow-env --allow-read index.ts <local-directory> [remote-directory]",
  );
  console.error(
    "Example: deno run --allow-net --allow-env --allow-read index.ts ./uploads /backups",
  );
  Deno.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey,
);

const results: {
  localPath: string;
  remotePath: string;
  size: number;
  success: boolean;
  error?: string;
}[] = [];

async function uploadDirectory(localPath: string, remotePath: string) {
  for await (const entry of Deno.readDir(localPath)) {
    const entryLocalPath = `${localPath}/${entry.name}`;
    const entryRemotePath = `${remotePath}/${entry.name}`;

    if (entry.isDirectory) {
      await uploadDirectory(entryLocalPath, entryRemotePath);
    } else if (entry.isFile) {
      try {
        const file = await Deno.open(entryLocalPath, { read: true });
        const fileInfo = await file.stat();
        const stream = file.readable;

        const success = await BunnyStorage.file.upload(
          storageZone,
          entryRemotePath,
          stream,
        );

        results.push({
          localPath: entryLocalPath,
          remotePath: entryRemotePath,
          size: fileInfo.size,
          success,
        });
      } catch (error) {
        results.push({
          localPath: entryLocalPath,
          remotePath: entryRemotePath,
          size: 0,
          success: false,
          error: error.message,
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
      2,
    ),
  );
} catch (error) {
  console.error("Error:", error.message);
  Deno.exit(1);
}
