import * as BunnySDK from "@bunny.net/edgescript-sdk";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log("Starting server...");
BunnySDK.net.http.serve(async (req) => {
  console.log(`[INFO]: ${req.method} - ${req.url}`);
  await sleep(1);
  return new Response("blbl");
});
