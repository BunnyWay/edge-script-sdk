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

const path = process.argv[2];

if (!path) {
  console.error("Usage: npx tsx index.ts <path>");
  console.error("Example: npx tsx index.ts /folder/file.txt");
  process.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey
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
      2
    )
  );
} catch (error) {
  console.error("Error deleting file:", (error as Error).message);
  process.exit(1);
}
