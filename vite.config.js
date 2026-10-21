import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import net from 'net';
import dns from 'dns/promises';

function realDatabaseBridgePlugin() {
  return {
    name: 'real-database-bridge',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/test-socket' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { host, port } = JSON.parse(body || '{}');
              const targetHost = host || 'pub400.com';
              const targetPort = Number(port) || 446;
              const startTime = Date.now();

              // Resolve DNS
              let ip = '';
              try {
                const lookup = await dns.lookup(targetHost);
                ip = lookup.address;
              } catch (e) {
                ip = 'Unknown';
              }

              // Real TCP Socket Connect
              const socket = new net.Socket();
              socket.setTimeout(4000);

              socket.connect(targetPort, targetHost, () => {
                const latency = Date.now() - startTime;
                socket.destroy();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  host: targetHost,
                  ip: ip,
                  port: targetPort,
                  latencyMs: latency,
                  message: `Socket TCP reale aperto con successo verso ${targetHost}:${targetPort} (IP ${ip}) in ${latency}ms`
                }));
              });

              socket.on('error', (err) => {
                socket.destroy();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  host: targetHost,
                  ip: ip,
                  port: targetPort,
                  error: err.message,
                  message: `Impossibile raggiungere ${targetHost}:${targetPort}: ${err.message}`
                }));
              });

              socket.on('timeout', () => {
                socket.destroy();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  host: targetHost,
                  port: targetPort,
                  error: 'Connection timed out',
                  message: `Timeout connessione su ${targetHost}:${targetPort}`
                }));
              });
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), realDatabaseBridgePlugin()],
});
