const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const fs = require("fs");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3020", 10);

async function start() {
  let handle;

  if (dev) {
    // Development mode
    const next = require("next");
    const app = next({ dev, hostname, port });
    await app.prepare();
    handle = app.getRequestHandler();
  } else {
    // Production standalone mode
    const NextServer = require("next/dist/server/next-server").default;
    let nextConfig = {};
    const configPath = path.join(__dirname, ".next/required-server-files.json");
    if (fs.existsSync(configPath)) {
      try {
        nextConfig = require(configPath).config;
      } catch (e) {
        console.warn("[Server] Could not parse required-server-files.json config", e);
      }
    }
    const nextServer = new NextServer({
      hostname,
      port,
      dir: __dirname,
      dev: false,
      conf: nextConfig,
    });
    handle = nextServer.getRequestHandler();
  }

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling request:", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  // Connected clients map: userId -> Set of active WebSocket instances
  const activeClients = new Map();

  wss.on("connection", (ws, req) => {
    const parsedUrl = parse(req.url, true);
    const userId = parsedUrl.query?.userId;

    if (userId && typeof userId === "string") {
      if (!activeClients.has(userId)) {
        activeClients.set(userId, new Set());
      }
      activeClients.get(userId).add(ws);
      console.log(`[WebSocket] Client connected for user: ${userId} (Total: ${activeClients.get(userId).size})`);

      ws.on("close", () => {
        const userSockets = activeClients.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            activeClients.delete(userId);
          }
        }
        console.log(`[WebSocket] Client disconnected for user: ${userId}`);
      });
    }

    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("error", (err) => {
      console.warn("[WebSocket] Client error:", err.message);
    });
  });

  // Keep-alive ping interval every 30 seconds
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(pingInterval);
  });

  // Intercept WebSocket upgrade requests on /mdz-crm/ws and /ws
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url);

    if (pathname === "/mdz-crm/ws" || pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  // Expose global broadcaster for Next.js API routes & background jobs
  global.broadcastWsNotification = (userId, notification) => {
    if (!userId) return false;
    const userSockets = activeClients.get(userId);

    if (userSockets && userSockets.size > 0) {
      const message = JSON.stringify({
        type: "NOTIFICATION",
        payload: notification,
      });

      userSockets.forEach((client) => {
        if (client.readyState === 1 /* WebSocket.OPEN */) {
          try {
            client.send(message);
          } catch (e) {
            console.warn("[WebSocket] Failed to send message to client socket:", e);
          }
        }
      });

      console.log(`[WebSocket] Broadcasted notification to ${userSockets.size} client socket(s) for user: ${userId}`);
      return true;
    }

    return false;
  };

  server.listen(port, () => {
    console.log(`\n> MDZ CRM Server ready on http://${hostname}:${port}/mdz-crm`);
    console.log(`> Live WebSocket listening on ws://${hostname}:${port}/mdz-crm/ws\n`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
