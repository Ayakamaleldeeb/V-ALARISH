const http = require("http");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

const USERS_FILE = path.join(__dirname, "users.json");

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sendJson(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".ttf":
      return "font/ttf";
    case ".otf":
      return "font/otf";
    default:
      return "application/octet-stream";
  }
}

function safeJoin(base, target) {
  const targetPath = path.normalize(path.join(base, target));
  if (!targetPath.startsWith(base)) return null;
  return targetPath;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function handleSignup(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { ok: false, message: e.message });
  }

  const name = String(body?.name || "").trim();
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || "");

  if (!name || !email || !password) {
    return sendJson(res, 400, { ok: false, message: "Missing fields" });
  }

  const users = readUsers();
  const exists = users.some((u) => normalizeEmail(u.email) === email);
  if (exists) {
    return sendJson(res, 409, { ok: false, message: "Email already exists" });
  }

  users.push({ id: Date.now(), name, email, password });
  writeUsers(users);
  return sendJson(res, 200, { ok: true, user: { name, email } });
}

async function handleLogin(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { ok: false, message: e.message });
  }

  const email = normalizeEmail(body?.email);
  const password = String(body?.password || "");

  if (!email || !password) {
    return sendJson(res, 400, { ok: false, message: "Missing fields" });
  }

  const users = readUsers();
  const user = users.find(
    (u) => normalizeEmail(u.email) === email && String(u.password) === password
  );

  if (!user) {
    return sendJson(res, 401, { ok: false, message: "Invalid email or password" });
  }

  return sendJson(res, 200, { ok: true, user: { name: user.name, email: user.email } });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const abs = safeJoin(__dirname, "." + pathname);
  if (!abs) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(abs, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      return res.end("Not found");
    }

    res.writeHead(200, { "Content-Type": getContentType(abs) });
    fs.createReadStream(abs).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/signup") return handleSignup(req, res);
  if (req.method === "POST" && req.url === "/api/login") return handleLogin(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`V-Alarish running at http://localhost:${PORT}`);
});

