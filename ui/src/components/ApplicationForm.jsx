import React, { useState } from 'react';

const ROOM_TYPES = [
  { type: 'foundation', name: 'Foundation' },
  { type: 'framing', name: 'Framing' },
  { type: 'plumbing', name: 'Bathroom Plumbing' },
  { type: 'electrical', name: 'Kitchen Electrical' },
  { type: 'roofing', name: 'Roofing' },
  { type: 'finishing', name: 'Interior Finishing' },
];

const TWO_STORY_ROOM_TYPES = [
  { type: 'foundation', name: 'Foundation' },
  { type: 'framing', name: 'Frame First Floor' },
  { type: 'crane', name: 'Crane Operation - Frame Second Floor (requires 2 workers)' },
  { type: 'plumbing', name: 'Bathroom Plumbing' },
  { type: 'electrical', name: 'Kitchen Electrical' },
  { type: 'roofing', name: 'Roofing' },
  { type: 'finishing', name: 'Interior Finishing' },
];

export default function ApplicationForm({ onSubmit, workers }) {
  const [customerName, setCustomerName] = useState('');
  const [houseType, setHouseType] = useState('one-story');
  const [selectedRooms, setSelectedRooms] = useState(ROOM_TYPES.map(r => r.type));
  const [workersByType, setWorkersByType] = useState({});

  const displayRooms = houseType === 'two-story' ? TWO_STORY_ROOM_TYPES : ROOM_TYPES;

  const toggleRoom = (type) => {
    setSelectedRooms(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const addWorker = (type) => {
    setWorkersByType(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
  };

  const removeWorker = (type) => {
    setWorkersByType(prev => {
      const count = prev[type] || 0;
      if (count <= 1) {
        const { [type]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [type]: count - 1 };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rooms = ROOM_TYPES.filter(r => selectedRooms.includes(r.type));
    onSubmit({ customerName, houseType, workersByType, rooms });
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: 20, borderRadius: 8 }}>
      <h2>New House Application</h2>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="customerName">Customer Name:</label><br />
        <input
          id="customerName"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          required
          style={{ padding: 8, width: '100%', marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="houseType">House Type:</label><br />
        <select
          id="houseType"
          value={houseType}
          onChange={e => setHouseType(e.target.value)}
          style={{ padding: 8, marginTop: 4 }}
        >
          <option value="one-story">One Story</option>
          <option value="two-story">Two Story</option>
        </select>
        {houseType === 'two-story' && (
          <p style={{ color: '#c00', fontSize: 14 }}>
            ⚠️ Two-story houses require crane operation
          </p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 8px' }}>Workers:</h4>
        {Object.keys(workersByType).length === 0 && (
          <p style={{ fontSize: 14, color: '#666' }}>No workers selected. Click "+" to add workers.</p>
        )}
        {Object.entries(workersByType).map(([type, count]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 'bold' }}>{type}</span>
            <span style={{ background: '#eee', padding: '2px 8px', borderRadius: 4 }}>{count}</span>
            <button
              type="button"
              onClick={() => removeWorker(type)}
              style={{ padding: '2px 8px', cursor: 'pointer' }}
            >
              -
            </button>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <label htmlFor="workerTypeSelect" style={{ fontSize: 12 }}>Add worker type:</label>
          <select
            id="workerTypeSelect"
            onChange={(e) => { if (e.target.value) { addWorker(e.target.value); e.target.value = ''; } }}
            style={{ padding: 6, marginLeft: 8 }}
          >
            <option value="">-- Select --</option>
            {workers.map(w => {
              const baseType = w.workerId.split('-')[0];
              return <option key={w.workerId} value={baseType}>{w.workerId} ({w.capabilities.join(', ')})</option>;
            })}
          </select>
        </div>
      </div>

      <fieldset style={{ marginBottom: 16 }}>
        <legend>Build Steps:</legend>
        {displayRooms.map(room => (
          <label key={room.type} style={{ display: 'block', margin: '4px 0', color: room.type === 'crane' ? '#c00' : undefined }}>
            <input
              type="checkbox"
              checked={selectedRooms.includes(room.type) || room.type === 'crane'}
              onChange={() => room.type !== 'crane' && toggleRoom(room.type)}
              disabled={room.type === 'crane'}
            />
            {' '}{room.name}
          </label>
        ))}
      </fieldset>

      <button type="submit" style={{ padding: '10px 24px', fontSize: 16, cursor: 'pointer' }}>
        Submit Application
      </button>
    </form>
  );
}
