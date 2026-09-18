import React, { useEffect, useState } from 'react';

export default function JobProgress({ job, apiUrl, onReset, onUpdate }) {
  const [currentJob, setCurrentJob] = useState(job);

  useEffect(() => {
    const eventSource = new EventSource(`${apiUrl}/api/applications/${job.id}/progress`);
    eventSource.onmessage = (event) => {
      const updated = JSON.parse(event.data);
      setCurrentJob(updated);
      if (onUpdate) onUpdate(updated);
    };
    return () => eventSource.close();
  }, [job.id, apiUrl, onUpdate]);

  const allComplete = currentJob.tasks.every(t => t.status === 'complete');

  return (
    <div style={{ border: '1px solid #ddd', padding: 20, borderRadius: 8 }}>
      <h2>Build Progress: {currentJob.customerName}'s {currentJob.houseType} house</h2>
      <p>Job ID: <code>{currentJob.id}</code></p>
      <p>Workers requested: <strong>{currentJob.workerCount}</strong></p>

      <div style={{ marginTop: 16 }}>
        {currentJob.tasks.map(task => (
          <div key={task.id} style={{ marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{task.name}</strong>
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                background: task.status === 'complete' ? '#d4edda' :
                            task.status === 'in-progress' ? '#fff3cd' : '#f8d7da',
              }}>
                {task.status}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ background: '#e9ecef', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                <div style={{
                  width: `${task.progress}%`,
                  height: '100%',
                  background: task.status === 'complete' ? '#28a745' : '#ffc107',
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>
                {task.progress}% — Worker: {task.worker || 'awaiting assignment'}
                {' '}— Type: <code>{task.type}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allComplete && (
        <div style={{ marginTop: 20, padding: 16, background: '#d4edda', borderRadius: 8, textAlign: 'center' }}>
          <h3>🎉 House Complete!</h3>
          <button onClick={onReset} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Build Another House
          </button>
        </div>
      )}
    </div>
  );
}
