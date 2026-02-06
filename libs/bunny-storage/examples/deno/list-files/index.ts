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

const path = Deno.args[0] || "/";

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey,
);

try {
  const files = await BunnyStorage.file.list(storageZone, path);

  console.log(
    JSON.stringify(
      {
        storageZone: zoneName,
        region,
        path,
        files: files.map((file) => ({
          name: file.objectName,
          path: file.path,
          size: file.length,
          isDirectory: file.isDirectory,
          dateModified: file.lastChanged.toISOString(),
          contentType: file.contentType,
        })),
        summary: {
          totalFiles: files.filter((f) => !f.isDirectory).length,
          totalDirectories: files.filter((f) => f.isDirectory).length,
          totalSize: files
            .filter((f) => !f.isDirectory)
            .reduce((sum, f) => sum + f.length, 0),
        },
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("Error listing files:", error.message);
  Deno.exit(1);
}
