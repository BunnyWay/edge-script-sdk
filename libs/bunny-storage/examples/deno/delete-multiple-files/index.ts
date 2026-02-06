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

const paths = Deno.args;

if (paths.length === 0) {
  console.error(
    "Usage: deno run --allow-net --allow-env index.ts <path1> <path2> ...",
  );
  console.error(
    "Example: deno run --allow-net --allow-env index.ts /file1.txt /file2.txt /folder/file3.txt",
  );
  Deno.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey,
);

const results: { path: string; success: boolean; error?: string }[] = [];

for (const path of paths) {
  try {
    const success = await BunnyStorage.file.remove(storageZone, path);
    results.push({ path, success });
  } catch (error) {
    results.push({ path, success: false, error: error.message });
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
    2,
  ),
);
