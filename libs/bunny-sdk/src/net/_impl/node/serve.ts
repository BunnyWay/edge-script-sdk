import * as Tcp from "../../tcp.ts";
import * as Ip from "../../ip.ts";
import { ServeHandler, ServerHandler } from "../../serve.ts";
import * as HonoNode from "@hono/node-server";
import { Hono } from "hono";
import * as SocketAddr from "../../socket_addr.ts";

export function node_serve(listener: Tcp.TcpListener, handler: ServerHandler): ServeHandler {
  const addr = Tcp.unstable_local_addr(listener);

  if (!SocketAddr.isV4(addr)) {
    throw new Error("An issue happened with the addr.");
  }

  const port = SocketAddr.v4.port(addr);
  const hostname = Ip.toString(SocketAddr.v4.ip(addr));

  const app = new Hono();
  app.all("*", (c) => {
    return handler(c.req.raw);
  })

  HonoNode.serve({
    fetch: app.fetch, hostname, port
  });
  return ({});
}
