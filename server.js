const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const DATA_FILE = path.join(__dirname, "data.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// ── Data helpers ──────────────────────────────────────────────
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    const initial = { participants: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── HTTP helpers ──────────────────────────────────────────────
function sendJson(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function serveFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    res.writeHead(statusCode, { "Content-Type": contentType });
    res.end(data);
  });
}

// ── Server ────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  // ── API: GET /api/participants ──
  if (pathname === "/api/participants" && req.method === "GET") {
    const data = readData();
    return sendJson(res, 200, data.participants);
  }

  // ── API: POST /api/participants  (add a new participant) ──
  if (pathname === "/api/participants" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const data = readData();
      // Prevent duplicate IDs
      if (data.participants.find(p => p.id === body.id)) {
        return sendJson(res, 409, { error: "Participant already exists" });
      }
      data.participants.push({
        id: body.id,
        name: body.name || body.id,
        status: { kit: false, accommodation: false, food: false },
      });
      writeData(data);
      return sendJson(res, 201, { ok: true });
    } catch {
      return sendJson(res, 400, { error: "Invalid request body" });
    }
  }

  // ── API: GET /api/participant/:id ──
  if (pathname.startsWith("/api/participant/") && req.method === "GET") {
    const id = pathname.split("/api/participant/")[1];
    const data = readData();
    const p = data.participants.find(x => x.id === id);
    if (!p) return sendJson(res, 404, { error: "Not found" });
    return sendJson(res, 200, p);
  }

  // ── API: POST /api/participant/:id/status ──
  if (pathname.match(/^\/api\/participant\/.+\/status$/) && req.method === "POST") {
    const parts = pathname.split("/");
    const id = parts[3]; // /api/participant/<id>/status
    try {
      const body = await readBody(req);
      const data = readData();
      const p = data.participants.find(x => x.id === id);
      if (!p) return sendJson(res, 404, { error: "Not found" });
      p.status = {
        kit: !!body.kit,
        accommodation: !!body.accommodation,
        food: !!body.food,
      };
      writeData(data);
      return sendJson(res, 200, { ok: true });
    } catch {
      return sendJson(res, 400, { error: "Invalid request body" });
    }
  }

  // ── Pages ───────────────────────────────────────────────────
  // Route /p/<ID> → participant.html
  if (pathname.startsWith("/p/")) {
    return serveFile(res, path.join(PUBLIC_DIR, "participant.html"));
  }

  // Root → index.html
  if (pathname === "/" || pathname === "") {
    return serveFile(res, path.join(PUBLIC_DIR, "index.html"));
  }

  // Static files
  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("403 Forbidden");
  }
  serveFile(res, filePath);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  🚀 Socio-O-Thon website is running!\n`);
  console.log(`  Dashboard:          http://localhost:${PORT}/`);
  console.log(`  Participant SOT001: http://localhost:${PORT}/p/SOT001\n`);
  console.log(`  Data saved to:      ${DATA_FILE}\n`);
  console.log(`  Other devices on your Wi-Fi can access via your local IP on port ${PORT}`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
