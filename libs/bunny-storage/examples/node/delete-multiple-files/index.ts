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

const paths = process.argv.slice(2);

if (paths.length === 0) {
  console.error("Usage: npx tsx index.ts <path1> <path2> ...");
  console.error(
    "Example: npx tsx index.ts /file1.txt /file2.txt /folder/file3.txt"
  );
  process.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey
);

const results: { path: string; success: boolean; error?: string }[] = [];

for (const path of paths) {
  try {
    const success = await BunnyStorage.file.remove(storageZone, path);
    results.push({ path, success });
  } catch (error) {
    results.push({ path, success: false, error: (error as Error).message });
  }
}

console.log(
  JSON.stringify(
    {
      storageZone: zoneName,
      region,
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    },
    null,
    2
  )
);
