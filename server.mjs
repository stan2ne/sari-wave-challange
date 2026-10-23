// @ts-check
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new RangeError('1024–65535 arasında açık bir port belirt. Örnek: node server.mjs 5173');
const files = new Map([['/','index.html'],['/index.html','index.html'],['/style.css','style.css'],['/save.js','save.js'],['/progression.js','progression.js'],['/library.js','library.js'],['/music.js','music.js'],['/engine.js','engine.js'],['/game.js','game.js'],['/icon.svg','icon.svg']]);
const types = new Map([['html','text/html; charset=utf-8'],['css','text/css; charset=utf-8'],['js','text/javascript; charset=utf-8'],['svg','image/svg+xml']]);
const server = createServer(async (request,response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const file = files.get(pathname);
  if (!file) { response.writeHead(404);response.end('Dosya bulunamadı: '+pathname);return; }
  try {
    const data = await readFile(fileURLToPath(new URL(file,import.meta.url)));
    response.writeHead(200,{'Content-Type':types.get(file.split('.').at(-1) ?? '') ?? 'application/octet-stream','Cache-Control':'no-cache'});
    response.end(data);
  } catch(error) {
    response.writeHead(500);response.end('Oyun dosyası okunamadı: '+file);
    throw error;
  }
});
server.listen(port,'127.0.0.1',() => process.stdout.write(`Oyun hazır: http://127.0.0.1:${port}\n`));
