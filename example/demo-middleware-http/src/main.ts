import * as BunnySDK from "../../../libs/bunny-sdk/esm/lib.mjs";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log("Starting server...");

BunnySDK.net.http.servePullZone({ url: "https://perdu.com/" }).onOriginRequest(async (ctx) => {
  const req = ctx.request;
  console.log(`[INFO]: ${req.method} - ${req.url}`);
  await sleep(1);
  return ctx.request;
}).onOriginResponse(async (ctx) => {
  const res = ctx.response;
  console.log(`[INFO]: ${res.status}`);
  await sleep(1);
  return ctx.response;
});
