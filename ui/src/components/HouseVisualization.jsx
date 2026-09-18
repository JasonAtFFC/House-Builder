import React from 'react';

const TASK_ORDER = ['foundation', 'crane', 'framing', 'plumbing', 'electrical', 'roofing', 'finishing'];

function getTaskMap(tasks) {
  const map = {};
  for (const t of tasks) map[t.type] = t;
  return map;
}

const wiggleKeyframes = `
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
`;

function ActiveWorker({ task, flipped }) {
  if (!task || task.status === 'pending') return null;
  const working = task.status === 'in-progress';
  const tool = task.status === 'complete' ? '✅' : '🔨';
  return (
    <span style={{ fontSize: 24, display: 'inline-block' }}>
      <style>{wiggleKeyframes}</style>
      <span style={{ display: 'inline-block', animation: working ? 'bounce 0.6s ease-in-out infinite' : undefined, transform: flipped ? 'scaleX(-1)' : undefined }}>👷</span>
      <span style={{ display: 'inline-block', animation: working ? 'wiggle 0.4s ease-in-out infinite' : undefined }}>
        {tool}
      </span>
    </span>
  );
}

export default function HouseVisualization({ tasks }) {
  if (!tasks || tasks.length === 0) return null;

  const tm = getTaskMap(tasks);
  const done = (type) => tm[type]?.status === 'complete';
  const active = (type) => tm[type]?.status === 'in-progress';
  const hasCrane = !!tm.crane;
  const isTwoStory = hasCrane;

  // Build rows based on progress
  const foundationDone = done('foundation');
  const framingDone = done('framing');
  const plumbingDone = done('plumbing');
  const electricalDone = done('electrical');
  const roofingDone = done('roofing');
  const finishingDone = done('finishing');
  const craneDone = done('crane');
  const allDone = tasks.every(t => t.status === 'complete');

  const brickRow = '🧱🧱🧱🧱🧱🧱';
  const wallRow = '🧱🪟🧱🧱🚪🧱';

  return (
    <div style={{ fontFamily: 'monospace', lineHeight: 1.4, padding: 20 }}>
      <h3 style={{ marginBottom: 16 }}>🏗️ Construction Site</h3>

      <div style={{ position: 'relative', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>

        {/* Celebration */}
        {allDone && (
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉🎉🎉</div>
        )}

        {/* Roof */}
        {roofingDone && (
          <div style={{ textAlign: 'center', marginBottom: -4 }}>
            <div style={{ letterSpacing: -2 }}>
              <span style={{ color: '#8B4513', fontSize: 22 }}>{'   ◢◣'}</span>
            </div>
            <div style={{ letterSpacing: -2 }}>
              <span style={{ color: '#8B4513', fontSize: 22 }}>{'  ◢🟫◣'}</span>
            </div>
            <div style={{ letterSpacing: -2 }}>
              <span style={{ color: '#8B4513', fontSize: 22 }}>{'◢🟫🟫🟫◣'}</span>
            </div>
          </div>
        )}
        {active('roofing') && (
          <div style={{ marginBottom: 4 }}>
            <ActiveWorker task={tm.roofing} />
          </div>
        )}

        {/* Second floor (two-story) */}
        {isTwoStory && framingDone && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>{wallRow}</div>
            <div style={{ fontSize: 22 }}>{brickRow}</div>
          </div>
        )}

        {/* Crane */}
        {hasCrane && active('crane') && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>🏗️</span>
            <span style={{ fontSize: 24, display: 'inline-block' }}>
              <style>{wiggleKeyframes}</style>
              <span style={{ display: 'inline-block', animation: 'bounce 0.6s ease-in-out infinite' }}>👷</span>
              <span style={{ display: 'inline-block', animation: 'wiggle 0.4s ease-in-out infinite' }}>🔨</span>
            </span>
            <span style={{ fontSize: 24, display: 'inline-block', marginLeft: 8 }}>
              <span style={{ display: 'inline-block', animation: 'bounce 0.6s ease-in-out infinite', transform: 'scaleX(-1)' }}>👷</span>
              <span style={{ display: 'inline-block', animation: 'wiggle 0.4s ease-in-out infinite' }}>📦</span>
            </span>
          </div>
        )}

        {/* Interior work indicators */}
        {active('plumbing') && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>🚿</span>
            <ActiveWorker task={tm.plumbing} />
          </div>
        )}
        {active('electrical') && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <ActiveWorker task={tm.electrical} />
          </div>
        )}
        {active('finishing') && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>🎨</span>
            <ActiveWorker task={tm.finishing} />
          </div>
        )}

        {/* First floor walls (after framing) */}
        {framingDone && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>{wallRow}</div>
            <div style={{ fontSize: 22 }}>{brickRow}</div>
          </div>
        )}
        {active('framing') && (
          <div style={{ marginBottom: 4 }}>
            <ActiveWorker task={tm.framing} />
          </div>
        )}

        {/* Foundation */}
        {foundationDone && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, background: '#666', borderRadius: 4, display: 'inline-block', padding: '2px 4px' }}>
              {'⬛⬛⬛⬛⬛⬛⬛⬛'}
            </div>
          </div>
        )}
        {active('foundation') && (
          <div style={{ marginBottom: 4 }}>
            <ActiveWorker task={tm.foundation} />
          </div>
        )}

        {/* Ground */}
        <div style={{ fontSize: 22, marginTop: 4 }}>{'🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱'}</div>
      </div>

      {/* Worker status legend */}
      <div style={{ marginTop: 20, fontSize: 13, color: '#666', borderTop: '1px solid #eee', paddingTop: 12 }}>
        <strong>Workers on site:</strong>
        {tasks.filter(t => t.status === 'in-progress').map(t => (
          <div key={t.id}>👷 {t.worker || 'unassigned'} → {t.name}</div>
        ))}
        {tasks.every(t => t.status !== 'in-progress') && !allDone && (
          <div>⏳ Waiting for workers...</div>
        )}
        {allDone && <div>✅ All workers done! House complete!</div>}
      </div>
    </div>
  );
}
