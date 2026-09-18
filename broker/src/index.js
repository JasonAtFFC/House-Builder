import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// Channels: Map<channelName, subscriber[]>
// Each subscriber is an SSE response object
const channels = new Map();

// Publish a message to a channel
app.post('/publish/:channel', (req, res) => {
  const { channel } = req.params;
  const message = req.body;
  const subscribers = channels.get(channel) || [];
  const payload = JSON.stringify({ id: uuidv4(), channel, data: message, timestamp: Date.now() });

  subscribers.forEach(sub => sub.write(`data: ${payload}\n\n`));
  res.json({ delivered: subscribers.length });
});

// Subscribe to a channel via SSE
app.get('/subscribe/:channel', (req, res) => {
  const { channel } = req.params;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected', channel })}\n\n`);

  if (!channels.has(channel)) channels.set(channel, []);
  channels.get(channel).push(res);

  req.on('close', () => {
    const subs = channels.get(channel);
    if (subs) {
      channels.set(channel, subs.filter(s => s !== res));
    }
  });
});

const PORT = process.env.BROKER_PORT || 3002;
app.listen(PORT, () => console.log(`Message broker running on port ${PORT}`));
