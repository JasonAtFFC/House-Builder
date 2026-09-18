# House Builder

A multi-component distributed system for managing house construction applications.

## Architecture

```
┌─────────┐       ┌─────────┐       ┌────────────────┐       ┌────────────────┐
│  React  │──────▶│   API   │──────▶│ Message Broker │◀──────│ General Worker │
│   UI    │◀─SSE──│  Server │◀──────│   (Pub/Sub)    │──────▶│  (all tasks)   │
└─────────┘       └─────────┘       └────────────────┘       └────────────────┘
                                            ▲
                                            │
                                     ┌──────┴───────┐
                                     │ Crane Worker │
                                     └──────────────┘
```

### Components

- **UI** (React + Vite) — Customer submits house-building applications, views real-time progress
- **API Server** (Express) — Receives applications, dispatches work via broker, streams progress via SSE
- **Message Broker** (Express + SSE) — Custom pub/sub broker with HTTP publish and SSE subscribe
- **General Worker** — Handles foundation, framing, plumbing, electrical, roofing, and finishing tasks
- **Crane Worker** — Handles crane operations for multi-story construction

### Message Flow

1. Customer submits application via UI
2. API breaks house into tasks and publishes each to `work:dispatch` channel on the broker
3. Workers subscribed to `work:dispatch` pick up tasks matching their capabilities
4. Workers publish progress to `worker:progress` channel on the broker
5. API relays progress to UI via Server-Sent Events

### House Types

- **One Story** — Standard sequential build: foundation → framing → plumbing → electrical → roofing → finishing
- **Two Story** — Adds a crane operation after first floor framing to lift materials for the second floor. This step requires two workers coordinating simultaneously (crane operator + unloader).

## Running

```bash
# With Docker
docker-compose up --build

# Local development (no external dependencies)
npm install
npm run dev:local
```

## Project Structure

```
├── ui/                  # React frontend (Vite)
├── api/                 # Express API server
├── broker/              # Pub/sub message broker
├── workers/
│   ├── general/         # General construction worker
│   └── crane/           # Crane operation worker
├── docker-compose.yml
└── package.json         # Workspace root
```
