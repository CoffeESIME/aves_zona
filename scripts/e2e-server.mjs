import { createServer } from 'node:http';
import next from 'next';

const hostname = '127.0.0.1';
const port = 3010;
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((request, response) => handle(request, response));
server.listen(port, hostname, () => {
  process.stdout.write(`E2E server ready at http://${hostname}:${port}\n`);
});

async function shutdown() {
  server.close(async () => {
    await app.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
