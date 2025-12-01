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

const remotePath = Deno.args[0];
const localPath = Deno.args[1];

if (!remotePath || !localPath) {
  console.error(
    "Usage: deno run --allow-net --allow-env --allow-write index.ts <remote-path> <local-path>",
  );
  console.error(
    "Example: deno run --allow-net --allow-env --allow-write index.ts /folder/file.txt ./downloaded.txt",
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
  const { stream, length } = await BunnyStorage.file.download(
    storageZone,
    remotePath,
  );

  const file = await Deno.open(localPath, { write: true, create: true });
  await stream.pipeTo(file.writable);

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
      2,
    ),
  );
} catch (error) {
  console.error("Error downloading file:", error.message);
  Deno.exit(1);
}
