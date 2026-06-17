import * as BunnySDK from "@bunny.net/edgescript-sdk";

type BunnyWebSocket = {
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  close(code?: number, reason?: string): void;
  addEventListener(
    type: "open",
    listener: () => void,
  ): void;
  addEventListener(
    type: "message",
    listener: (event: { data: string | ArrayBuffer }) => void,
  ): void;
  addEventListener(
    type: "close",
    listener: (event: {
      code: number;
      reason: string;
      wasClean: boolean;
    }) => void,
  ): void;
  addEventListener(type: "error", listener: (event: Event) => void): void;
};

type UpgradeOptions = { protocol?: string; idleTimeout?: number };

declare global {
  interface Request {
    upgradeWebSocket(options?: UpgradeOptions): {
      response: Response;
      socket: BunnyWebSocket;
    };
  }
}

const port = parseInt(process.env.PORT || "8080", 10);

console.log(`Starting WebSocket echo server on :${port}`);

BunnySDK.net.http.serve({ port, hostname: "127.0.0.1" }, (req) => {
  const upgrade = req.headers.get("upgrade");
  if (upgrade?.toLowerCase() !== "websocket") {
    return new Response(
      "WebSocket endpoint. Connect with a WebSocket client.",
      { status: 426, headers: { "content-type": "text/plain" } },
    );
  }

  const { response, socket } = req.upgradeWebSocket({ idleTimeout: 60 });

  socket.addEventListener("open", () => {
    console.log("Client connected");
    socket.send("Welcome to Bunny Edge!");
  });

  socket.addEventListener("message", (event) => {
    console.log("Received:", event.data);
    socket.send(`Echo: ${event.data}`);
  });

  socket.addEventListener("close", (event) => {
    console.log(
      `Client disconnected: code=${event.code} reason="${event.reason}"`,
    );
  });

  socket.addEventListener("error", () => {
    console.error("WebSocket error");
  });

  return response;
});
