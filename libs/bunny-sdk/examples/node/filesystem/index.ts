import * as BunnySDK from "@bunny.net/edgescript-sdk";
import * as fs from "node:fs/promises";

const COUNTER_PATH = "/tmp/counter.txt";
const port = parseInt(process.env.PORT || "8080", 10);

async function readCounter(): Promise<number> {
  try {
    const data = await fs.readFile(COUNTER_PATH, "utf-8");
    const parsed = parseInt(data, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return 0;
    }
    throw error;
  }
}

async function writeCounter(value: number): Promise<void> {
  await fs.writeFile(COUNTER_PATH, value.toString(), "utf-8");
}

console.log(`Starting node:fs example on :${port}`);

BunnySDK.net.http.serve({ port, hostname: "127.0.0.1" }, async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/reset" && req.method === "POST") {
    await writeCounter(0);
    return new Response(JSON.stringify({ visits: 0, reset: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  const visits = (await readCounter()) + 1;
  await writeCounter(visits);

  const stats = await fs.stat(COUNTER_PATH);

  return new Response(
    JSON.stringify(
      {
        url: req.url,
        method: req.method,
        visits,
        counterFile: {
          path: COUNTER_PATH,
          size: stats.size,
        },
      },
      null,
      2,
    ),
    { headers: { "content-type": "application/json" } },
  );
});
