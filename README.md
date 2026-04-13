<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AgentMesh (React frontend + Python backend)

This repo follows `BRD.md`’s architecture:
- **Frontend (React/Vite):** Observer dashboard (live thought process + transactions)
- **Backend (Python/FastAPI):** “Brain” service that orchestrates agents and streams events

View your app in AI Studio: https://ai.studio/apps/790177f4-7f07-4833-83bc-66a6d9ceca97

## Run Locally

**Prerequisites:** Node.js, Python 3.11+

1. Install dependencies:
   `npm install`
2. Start the Python backend:

   ```bash
   cd Backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

3. Start the React frontend (in another terminal, from repo root):
   `npm run dev`

The frontend proxies `/api/*` and `/events` to `http://localhost:8000`.
