# Backend (Python)

FastAPI service that simulates the **AgentMesh** “brain” per `BRD.md`:
- Streams **Manager thought process** logs
- Streams **x402 settlement** transaction receipts (mocked)

## Setup

```bash
cd Backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Frontend (Vite) will proxy `/api/*` and `/events` to `http://localhost:8000`.
