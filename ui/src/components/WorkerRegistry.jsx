import React, { useEffect, useState } from 'react';

export default function WorkerRegistry({ apiUrl }) {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/workers`);
        setWorkers(await res.json());
      } catch (e) { /* ignore */ }
    };
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  if (workers.length === 0) return null;

  return (
    <div style={{ marginBottom: 20, padding: 12, background: '#e8f4fd', borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 8px' }}>Registered Workers</h3>
      {workers.map(w => (
        <div key={w.workerId} style={{ fontSize: 14, marginBottom: 4 }}>
          <strong>{w.workerId}</strong>: {w.capabilities.join(', ')}
        </div>
      ))}
    </div>
  );
}
