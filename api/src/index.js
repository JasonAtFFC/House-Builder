import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const BROKER_URL = process.env.BROKER_URL || 'http://localhost:3002';

const jobs = new Map();
const workers = new Map();
const sseClients = new Map();

// Subscribe to worker progress from the broker
function subscribeToProgress() {
  fetch(`${BROKER_URL}/subscribe/worker:progress`).then(async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const envelope = JSON.parse(line.slice(6));
            if (envelope.type === 'connected') continue;
            const update = envelope.data;
            const job = jobs.get(update.jobId);
            if (job) {
              const task = job.tasks.find(t => t.id === update.taskId);
              if (task) {
                task.status = update.status;
                task.progress = update.progress;
                task.worker = update.worker;

                // When crane completes, dispatch remaining blocked tasks
                if (task.type === 'crane' && task.status === 'complete') {
                  const craneIdx = job.tasks.indexOf(task);
                  for (let i = craneIdx + 1; i < job.tasks.length; i++) {
                    const blocked = job.tasks[i];
                    fetch(`${BROKER_URL}/publish/work:dispatch`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ jobId: job.id, taskId: blocked.id, type: blocked.type, name: blocked.name, requiredWorkers: 1 }),
                    });
                  }
                }
              }
              const client = sseClients.get(update.jobId);
              if (client) client.write(`data: ${JSON.stringify(job)}\n\n`);
            }
          } catch (e) {}
        }
      }
    }
  }).catch(() => setTimeout(subscribeToProgress, 2000));
}
subscribeToProgress();

// Submit a new house building application
app.post('/api/applications', async (req, res) => {
  const { customerName, houseType, workersByType, rooms } = req.body;
  const jobId = uuidv4();

  let tasks;

  if (houseType === 'two-story') {
    // Two-story: foundation → frame first floor → crane (frame second floor, needs 2 workers) → remaining tasks
    tasks = [
      { id: uuidv4(), type: 'foundation', name: 'Foundation', status: 'pending', progress: 0, worker: null },
      { id: uuidv4(), type: 'framing', name: 'Frame First Floor', status: 'pending', progress: 0, worker: null },
      { id: uuidv4(), type: 'crane', name: 'Crane Operation - Frame Second Floor', status: 'pending', progress: 0, worker: null, requiredWorkers: 2 },
      ...rooms
        .filter(r => !['foundation', 'framing'].includes(r.type))
        .map(room => ({ id: uuidv4(), type: room.type, name: room.name, status: 'pending', progress: 0, worker: null })),
    ];
  } else {
    tasks = rooms.map(room => ({
      id: uuidv4(),
      type: room.type,
      name: room.name,
      status: 'pending',
      progress: 0,
      worker: null,
    }));
  }

  const job = { id: jobId, customerName, houseType, workersByType, tasks, status: 'in-progress', createdAt: new Date().toISOString() };
  jobs.set(jobId, job);

  // Dispatch tasks sequentially — for two-story, tasks after crane are blocked until crane completes
  for (const task of tasks) {
    if (task.type === 'crane') break; // Stop dispatching here; post-crane tasks dispatched after crane completes
    await fetch(`${BROKER_URL}/publish/work:dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, taskId: task.id, type: task.type, name: task.name, requiredWorkers: task.requiredWorkers || 1 }),
    });
  }

  // Dispatch crane task
  const craneTask = tasks.find(t => t.type === 'crane');
  if (craneTask) {
    await fetch(`${BROKER_URL}/publish/work:dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, taskId: craneTask.id, type: craneTask.type, name: craneTask.name, requiredWorkers: craneTask.requiredWorkers }),
    });
  }

  // For one-story, dispatch all tasks immediately
  if (houseType !== 'two-story') {
    for (const task of tasks) {
      await fetch(`${BROKER_URL}/publish/work:dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, taskId: task.id, type: task.type, name: task.name, requiredWorkers: 1 }),
      });
    }
  }

  res.json(job);
});

app.get('/api/applications/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

app.get('/api/applications', (req, res) => res.json([...jobs.values()]));

// SSE for UI progress
app.get('/api/applications/:id/progress', (req, res) => {
  const jobId = req.params.id;
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const job = jobs.get(jobId);
  if (job) res.write(`data: ${JSON.stringify(job)}\n\n`);
  sseClients.set(jobId, res);
  req.on('close', () => sseClients.delete(jobId));
});

// Worker registration
app.post('/api/workers/register', (req, res) => {
  const { workerId, capabilities } = req.body;
  workers.set(workerId, { workerId, capabilities, registeredAt: new Date().toISOString() });
  console.log(`Worker registered: ${workerId} with capabilities: ${capabilities}`);
  res.json({ status: 'registered' });
});

app.get('/api/workers', (req, res) => res.json([...workers.values()]));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
