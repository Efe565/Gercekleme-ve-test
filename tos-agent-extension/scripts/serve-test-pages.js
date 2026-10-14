/**
 * ToS-Agent TR - Yerel Test Sunucusu
 * Cypress testleri ve video kaydı için test sayfalarını 3000 portunda sunar.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = path.join(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  if (reqPath === '/' || reqPath === '/index.html') {
    reqPath = '/test-pages/index.html';
  } else if (!reqPath.startsWith('/test-pages/') && !reqPath.startsWith('/popup/') && !reqPath.startsWith('/content/') && !reqPath.startsWith('/lib/') && !reqPath.startsWith('/icons/')) {
    reqPath = '/test-pages' + reqPath;
  }

  const filePath = path.join(ROOT_DIR, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Dosya Bulunamadı: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': mime,
    'Access-Control-Allow-Origin': '*'
  });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

server.listen(PORT, () => {
  console.log(`[ToS-Agent Test Sunucusu] Çalışıyor: http://localhost:${PORT}`);
  console.log(`[Test Laboratuvarı]: http://localhost:${PORT}/test-pages/index.html`);
});

module.exports = server;
