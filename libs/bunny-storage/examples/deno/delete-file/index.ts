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

const path = Deno.args[0];

if (!path) {
  console.error("Usage: deno run --allow-net --allow-env index.ts <path>");
  console.error(
    "Example: deno run --allow-net --allow-env index.ts /folder/file.txt",
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
  const success = await BunnyStorage.file.remove(storageZone, path);

  console.log(
    JSON.stringify(
      {
        storageZone: zoneName,
        region,
        deleted: path,
        success,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("Error deleting file:", error.message);
  Deno.exit(1);
}
