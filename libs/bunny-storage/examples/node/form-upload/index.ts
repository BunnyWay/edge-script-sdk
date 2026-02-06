import { createServer } from "node:http";
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

const storageRegion = region as BunnyStorage.regions.StorageRegion;
const storageZone = BunnyStorage.zone.connect_with_accesskey(
  storageRegion,
  zoneName,
  apiKey
);

const port = 8080;

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

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${port}`);

  if (url.pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (url.pathname === "/upload" && req.method === "POST") {
    try {
      const formData = await parseMultipartForm(req);
      const file = formData.file;
      const remotePath = formData.path;

      if (!file || !remotePath) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing file or path" }));
        return;
      }

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(file.data);
          controller.close();
        },
      });

      const success = await BunnyStorage.file.upload(
        storageZone,
        remotePath,
        stream,
        { contentType: file.contentType }
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          storageZone: zoneName,
          region,
          remotePath,
          fileName: file.filename,
          size: file.data.length,
          contentType: file.contentType,
          success,
        })
      );
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: (error as Error).message }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

interface ParsedFile {
  filename: string;
  contentType: string;
  data: Uint8Array;
}

interface ParsedForm {
  path?: string;
  file?: ParsedFile;
}

async function parseMultipartForm(
  req: import("node:http").IncomingMessage
): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      const contentType = req.headers["content-type"] || "";
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      if (!boundaryMatch) {
        reject(new Error("No boundary found"));
        return;
      }

      const boundary = boundaryMatch[1];
      const parts = body
        .toString("binary")
        .split(`--${boundary}`)
        .filter((p) => p && p !== "--\r\n" && p !== "--");

      const result: ParsedForm = {};

      for (const part of parts) {
        const [headerSection, ...contentParts] = part.split("\r\n\r\n");
        const content = contentParts.join("\r\n\r\n").replace(/\r\n$/, "");

        const nameMatch = headerSection.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const name = nameMatch[1];

        if (name === "path") {
          result.path = content;
        } else if (name === "file") {
          const filenameMatch = headerSection.match(/filename="([^"]+)"/);
          const contentTypeMatch = headerSection.match(
            /Content-Type:\s*([^\r\n]+)/i
          );
          result.file = {
            filename: filenameMatch?.[1] || "unknown",
            contentType: contentTypeMatch?.[1] || "application/octet-stream",
            data: Buffer.from(content, "binary"),
          };
        }
      }

      resolve(result);
    });
    req.on("error", reject);
  });
}

server.listen(port, () => {
  console.log(`Starting server on http://localhost:${port}`);
  console.log("Upload a file using the form or POST to /upload");
});
