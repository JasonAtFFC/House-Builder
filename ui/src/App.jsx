import React, { useState, useEffect } from 'react';
import ApplicationForm from './components/ApplicationForm.jsx';
import JobProgress from './components/JobProgress.jsx';
import WorkerRegistry from './components/WorkerRegistry.jsx';
import HouseVisualization from './components/HouseVisualization.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [activeJob, setActiveJob] = useState(null);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/workers`);
        setWorkers(await res.json());
      } catch (e) { /* ignore */ }
    };
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (application) => {
    const res = await fetch(`${API_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(application),
    });
    const job = await res.json();
    setActiveJob(job);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      {/* Left panel - controls & progress */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20, borderRight: '1px solid #ddd' }}>
        <h1>🏠 House Builder Application</h1>
        <WorkerRegistry apiUrl={API_URL} />
        {!activeJob ? (
          <ApplicationForm onSubmit={handleSubmit} workers={workers} />
        ) : (
          <JobProgress job={activeJob} apiUrl={API_URL} onReset={() => setActiveJob(null)} onUpdate={setActiveJob} />
        )}
      </div>

      {/* Right panel - emoji house visualization */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f0f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {activeJob ? (
          <HouseVisualization tasks={activeJob.tasks} />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', fontSize: 18 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
            <p>Submit an application to start building!</p>
          </div>
        )}
      </div>
    </div>
  );
}
