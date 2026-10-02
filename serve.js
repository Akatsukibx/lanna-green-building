// Tiny static server for the signage folder (no dependencies). Run: npm start  (or: node serve.js)
// Then open http://localhost:8099/  — PORT=9000 npm start  to change the port.
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname;
const port = Number(process.env.PORT) || 8099;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u.endsWith("/")) u += "index.html";
  const file = path.normalize(path.join(root, u));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end("forbidden"); }   // no path traversal
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}).listen(port, () => console.log("Signage running at http://localhost:" + port + "/  (Ctrl+C to stop)"));
