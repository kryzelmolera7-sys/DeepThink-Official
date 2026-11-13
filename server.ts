import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getEngineStatus,
  streamUniversalResponse,
  type ChatRequestBody,
} from './server/inference.ts';
import { formatInferenceError } from './src/utils/streamParser.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'deepthink-1' });
  });

  app.get('/api/engine/status', (_req, res) => {
    res.json(getEngineStatus());
  });

  app.post('/api/chat', async (req, res) => {
    const body = req.body as ChatRequestBody | undefined;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ error: 'Request must include at least one message.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const abortController = new AbortController();
    let closed = false;

    res.on('close', () => {
      if (!res.writableFinished) {
        closed = true;
        abortController.abort();
      }
    });

    const emit = (event: string, payload: unknown) => {
      if (closed || res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      await streamUniversalResponse(body, emit, abortController.signal);
    } catch (err) {
      console.error('Inference error in /api/chat:', err);
      if (!abortController.signal.aborted) {
        emit('error', { message: formatInferenceError(err) });
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DeepThink 1 server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DeepThink 1 server:', err);
  process.exit(1);
});
