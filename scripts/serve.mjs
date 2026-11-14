import http from 'node:http';
import worker from '../dist/server/index.js';
const server = http.createServer(async (req, res) => {
  try {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
    const result = await worker.fetch(request);
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(Buffer.from(await result.arrayBuffer()));
  } catch (e) { res.writeHead(500); res.end('Preview failed'); console.error(e); }
});
server.listen(Number(process.env.PORT || 8787), '127.0.0.1', () => console.log('Local: http://127.0.0.1:8787'));
