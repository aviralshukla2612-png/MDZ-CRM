const http = require("http");
const { parse } = require("url");
const path = require("path");
const fs = require("fs");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3020", 10);

// WebSocket setup
const wss = new WebSocketServer({ noServer: true });
const activeClients = new Map();

wss.on("connection", (ws, req) => {
  const parsedUrl = parse(req.url, true);
  const userId = parsedUrl.query?.userId;

  if (userId && typeof userId === "string") {
    if (!activeClients.has(userId)) {
      activeClients.set(userId, new Set());
    }
    activeClients.get(userId).add(ws);
    console.log(`[WebSocket] Client connected for user: ${userId} (Active: ${activeClients.get(userId).size})`);

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
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => clearInterval(pingInterval));

// Global notification broadcaster
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
          console.warn("[WebSocket] Send error:", e);
        }
      }
    });

    console.log(`[WebSocket] Broadcasted notification to ${userSockets.size} client socket(s) for user: ${userId}`);
    return true;
  }
  return false;
};

// Hook http.createServer to attach WebSocket to the server instance
const origCreateServer = http.createServer;
http.createServer = function (...args) {
  const server = origCreateServer.apply(this, args);

  server.on("newListener", (event) => {
    if (event === "upgrade" && !server._wsHooked) {
      server._wsHooked = true;
      process.nextTick(() => {
        const originalListeners = server.listeners("upgrade").slice();
        server.removeAllListeners("upgrade");
        server.on("upgrade", (req, socket, head) => {
          const { pathname } = parse(req.url);
          if (pathname === "/mdz-crm/ws" || pathname === "/ws") {
            wss.handleUpgrade(req, socket, head, (ws) => {
              wss.emit("connection", ws, req);
            });
          } else {
            for (const listener of originalListeners) {
              listener.call(server, req, socket, head);
            }
          }
        });
      });
    }
  });

  return server;
};

async function run() {
  if (dev) {
    // Development mode
    const next = require("next");
    const app = next({ dev, hostname, port });
    await app.prepare();
    const handle = app.getRequestHandler();

    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error handling request:", req.url, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    server.listen(port, () => {
      console.log(`> Dev Server ready on http://${hostname}:${port}/mdz-crm`);
      console.log(`> Live WebSocket listening on ws://${hostname}:${port}/mdz-crm/ws`);
    });
  } else {
    // Production Standalone mode
    const dir = path.resolve(__dirname);
    let nextConfig = {};
    const configPath = path.join(dir, ".next/required-server-files.json");
    if (fs.existsSync(configPath)) {
      try {
        nextConfig = require(configPath).config;
      } catch (e) {
        console.warn("[Server] Could not load required-server-files.json", e);
      }
    }
    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

    require("next");
    const { startServer } = require("next/dist/server/lib/start-server");

    let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10);
    if (Number.isNaN(keepAliveTimeout) || !Number.isFinite(keepAliveTimeout) || keepAliveTimeout < 0) {
      keepAliveTimeout = undefined;
    }

    startServer({
      dir,
      isDev: false,
      config: nextConfig,
      hostname,
      port,
      allowRetry: false,
      keepAliveTimeout,
    }).then(() => {
      console.log(`> Production Server ready on http://${hostname}:${port}/mdz-crm`);
      console.log(`> Live WebSocket listening on ws://${hostname}:${port}/mdz-crm/ws`);
    }).catch((err) => {
      console.error("[Server] Error starting production server:", err);
      process.exit(1);
    });
  }
}

run().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
