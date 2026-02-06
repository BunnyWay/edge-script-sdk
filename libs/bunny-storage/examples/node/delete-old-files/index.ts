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

const directory = process.argv[2];
const daysOld = parseInt(process.argv[3] || "30", 10);

if (!directory) {
  console.error("Usage: npx tsx index.ts <directory> [days]");
  console.error("Example: npx tsx index.ts /backups 30");
  console.error("  directory - The directory to scan for old files");
  console.error(
    "  days - Delete files older than this many days (default: 30)"
  );
  process.exit(1);
}

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey
);

const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - daysOld);

try {
  const files = await BunnyStorage.file.list(storageZone, directory);

  const oldFiles = files.filter(
    (file) => !file.isDirectory && file.lastChanged < cutoffDate
  );

  const results: { path: string; lastChanged: string; success: boolean }[] = [];

  for (const file of oldFiles) {
    const filePath = `${file.path}${file.objectName}`;
    const success = await BunnyStorage.file.remove(storageZone, filePath);
    results.push({
      path: filePath,
      lastChanged: file.lastChanged.toISOString(),
      success,
    });
  }

  console.log(
    JSON.stringify(
      {
        storageZone: zoneName,
        region,
        directory,
        cutoffDate: cutoffDate.toISOString(),
        daysOld,
        results,
        summary: {
          filesScanned: files.filter((f) => !f.isDirectory).length,
          filesDeleted: results.filter((r) => r.success).length,
          filesFailed: results.filter((r) => !r.success).length,
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
