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

const localPath = Deno.args[0];
const remotePath = Deno.args[1];

if (!localPath || !remotePath) {
  console.error(
    "Usage: deno run --allow-net --allow-env --allow-read index.ts <local-path> <remote-path>",
  );
  console.error(
    "Example: deno run --allow-net --allow-env --allow-read index.ts ./file.txt /folder/file.txt",
  );
  Deno.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey,
);

try {
  const file = await Deno.open(localPath, { read: true });
  const fileInfo = await file.stat();
  const stream = file.readable;

  const success = await BunnyStorage.file.upload(
    storageZone,
    remotePath,
    stream,
  );

  console.log(
    JSON.stringify(
      {
        storageZone: zoneName,
        region,
        localPath,
        remotePath,
        size: fileInfo.size,
        success,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("Error uploading file:", error.message);
  Deno.exit(1);
}
