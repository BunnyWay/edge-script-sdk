import * as BunnySDK from "@bunny.net/edgescript-sdk";

BunnySDK.net.http.serve(async (req: Request) => {
  const cache = BunnySDK.cache.default;
  // or: const cache = await BunnySDK.cache.open("custom");

  /**
   * Example cache fetch event
   *
   * 1. check whether a match for the request is found in the cache
   * 2. if no cache hit, attempt to download "bunny.png" from "my-site.com"
   * 3. update the cache
   *  - either: adding the resource for the first time
   *  - or:     update the cache to keep it alive for longer
   * 4. if this fails return a 404 error
   */
  const bunnyImg = new URL("https://www.my-site.com/gallery/bunny.png");
  const cachedResponse = cache
    .match(req)
    .then((r: Response | undefined) => (r !== undefined ? r : fetch(bunnyImg)))
    .then((r: Response) => {
      cache.put(req, r);
      return r.clone();
    })
    .catch((e: any) => {
      console.error(`[ERROR]: ${req.method} - ${req.url} :: ${e}`);
      new Response("", { status: 404 });
    });

  return cachedResponse;
});
