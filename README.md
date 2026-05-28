# HermesAudit
> Autonomous smart contract vulnerability scanner powered by Hermes Agent

## Stack
- **Frontend**: React 18 + Vite → deployed on Vercel
- **Backend**: FastAPI → deployed on Render  
- **AI**: Hermes Agent via OpenRouter (mistral-7b-instruct:free)

## What It Detects
Reentrancy · Missing Access Control · tx.origin Auth · Selfdestruct · Timestamp Dependence · Hardcoded Addresses

## Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
export OPENROUTER_API_KEY=sk-or-your-key-here
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deploy
- **Frontend**: Push to GitHub → Vercel auto-deploys from `frontend/` directory
- **Backend**: Push to GitHub → Deploy on Render with `uvicorn main:app --host 0.0.0.0 --port 8000`

## Challenge
Built for #hermesagentchallenge on DEV.to
