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

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey,
);

const port = 8080;

console.log(`Starting server on http://localhost:${port}`);
console.log("Upload a file using the form or POST to /upload");

Deno.serve({ port }, async (req: Request) => {
  const url = new URL(req.url);

  if (url.pathname === "/" && req.method === "GET") {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Bunny Storage Upload</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    input, button { margin: 10px 0; padding: 10px; }
    button { cursor: pointer; background: #ff6600; color: white; border: none; }
  </style>
</head>
<body>
  <h1>Bunny Storage Upload</h1>
  <form action="/upload" method="POST" enctype="multipart/form-data">
    <div>
      <label>Remote Path:</label><br>
      <input type="text" name="path" placeholder="/uploads/file.txt" required>
    </div>
    <div>
      <label>File:</label><br>
      <input type="file" name="file" required>
    </div>
    <button type="submit">Upload</button>
  </form>
</body>
</html>`;
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (url.pathname === "/upload" && req.method === "POST") {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const remotePath = formData.get("path") as string;

      if (!file || !remotePath) {
        return Response.json(
          { error: "Missing file or path" },
          { status: 400 },
        );
      }

      const stream = file.stream();
      const success = await BunnyStorage.file.upload(
        storageZone,
        remotePath,
        stream,
        { contentType: file.type },
      );

      return Response.json({
        storageZone: zoneName,
        region,
        remotePath,
        fileName: file.name,
        size: file.size,
        contentType: file.type,
        success,
      });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
