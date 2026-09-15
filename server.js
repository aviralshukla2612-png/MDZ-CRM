const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3020", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
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
    // In dev mode, Next.js internal HMR uses other upgrade paths which will fall through or be handled by Next
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
});
