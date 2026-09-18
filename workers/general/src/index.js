import { v4 as uuidv4 } from 'uuid';

const WORKER_ID = `general-${uuidv4().slice(0, 8)}`;
const CAPABILITIES = ['foundation', 'framing', 'plumbing', 'electrical', 'roofing', 'finishing'];
const BROKER_URL = process.env.BROKER_URL || 'http://localhost:3002';
const API_URL = process.env.API_URL || 'http://localhost:3001';

async function register() {
  try {
    await fetch(`${API_URL}/api/workers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId: WORKER_ID, capabilities: CAPABILITIES }),
    });
    console.log(`Registered as ${WORKER_ID} with capabilities:`, CAPABILITIES);
  } catch (err) {
    console.error('Registration failed, retrying...', err.message);
    setTimeout(register, 3000);
  }
}

async function doWork(jobId, taskId, type, name, role) {
  console.log(`[${WORKER_ID}] Starting: ${name} as ${role}`);

  for (let progress = 0; progress <= 100; progress += 20) {
    await new Promise(r => setTimeout(r, 1000));
    await fetch(`${BROKER_URL}/publish/worker:progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId, taskId, type,
        status: progress === 100 ? 'complete' : 'in-progress',
        progress, worker: WORKER_ID, role,
      }),
    });
  }

  console.log(`[${WORKER_ID}] Completed: ${name} as ${role}`);
}

async function claimRoleAndWait(task) {
  const taskId = task.taskId;
  const preferredRole = 'crane-unloader';

  console.log(`[${WORKER_ID}] Claiming role: ${preferredRole} for task ${taskId}`);

  await fetch(`${BROKER_URL}/publish/crane:sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, workerId: WORKER_ID, role: preferredRole, type: 'claim' }),
  });

  console.log(`[${WORKER_ID}] Waiting for partner to claim complementary role...`);

  const timeout = 15000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 1000));
    await fetch(`${BROKER_URL}/publish/crane:sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, workerId: WORKER_ID, role: preferredRole, type: 'claim' }),
    });
  }

  console.error(`[${WORKER_ID}] TIMEOUT: Coordination failed for task ${taskId}`);

  await fetch(`${BROKER_URL}/publish/worker:progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: task.jobId, taskId, type: 'crane',
      status: 'failed', progress: 0, worker: WORKER_ID,
      error: 'Coordination failed — no orchestrator to assign roles',
    }),
  });

  return false;
}

async function listenForSync() {
  try {
    const res = await fetch(`${BROKER_URL}/subscribe/crane:sync`);
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
            const msg = envelope.data;
            if (msg.workerId !== WORKER_ID) {
              console.log(`[${WORKER_ID}] Saw partner ${msg.workerId} claim role: ${msg.role}`);
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    setTimeout(listenForSync, 2000);
  }
}

async function listenForWork() {
  try {
    const res = await fetch(`${BROKER_URL}/subscribe/work:dispatch`);
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
            const task = envelope.data;
            if (!CAPABILITIES.includes(task.type)) {
              console.log(`[${WORKER_ID}] Skipping task "${task.name}" — no capability for type: ${task.type}`);
              continue;
            }

            if (task.requiredWorkers > 1) {
              await claimRoleAndWait(task);
            } else {
              await doWork(task.jobId, task.taskId, task.type, task.name, 'sole');
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.error('Connection lost, reconnecting...', err.message);
    setTimeout(listenForWork, 2000);
  }
}

register();
listenForSync();
listenForWork();
