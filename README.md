# Neighbourhood Trust Score

![Tests](https://github.com/<your-username>/neighbourhood-trust-score/actions/workflows/tests.yml/badge.svg)
![Live](https://img.shields.io/website?url=https%3A%2F%2Fneighbourhood-trust-score.vercel.app&label=live)
![Python](https://img.shields.io/badge/python-3.12-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-black)

A tool that scores reviews for a local business using a set of explainable signals: generic text, rating and text mismatches, clustered posting dates, and anonymous reviewer names. Reviews are pasted in manually, nothing is fetched automatically, so there is no external API or billing account involved.

Live: https://neighbourhood-trust-score.vercel.app/

## Highlights

- Decoupled frontend and backend, deployed and scaled independently on Vercel and Render.
- Explainable scoring engine. Every flag traces back to a specific, documented rule, no black-box model.
- Zero external API dependency by design, so the project needs no third-party billing credentials to run.
- Backend covered by an automated pytest suite, run on every push through GitHub Actions.

## What it does

Enter a business name and a handful of reviews. The backend runs them through independent checks and returns a signal score plus a breakdown of what triggered it. It does not claim any review is fake, it surfaces signals for you to judge alongside the star rating you already see.

## Architecture

```
+--------------------+
|      FRONTEND      |
|    React + Vite    |
|      (Vercel)      |
+--------------------+
          |
          |  HTTPS / JSON
          v
+--------------------+
|      BACKEND       |
|  FastAPI (Python)  |
|      (Render)      |
+--------------------+
```

Frontend: React 18, Vite, hand-built SVG components, no charting or UI library.
Backend: FastAPI, Pydantic, pure Python heuristic scoring, no ML dependency.

## Repository structure

```
neighbourhood-trust-score/
├── .github/
│   └── workflows/
│       └── tests.yml        # CI, runs pytest on every push
├── backend/
│   ├── main.py              # FastAPI app, POST /api/analyze
│   ├── scoring.py           # scoring logic
│   ├── requirements.txt
│   ├── render.yaml
│   ├── .python-version
│   ├── .env.example
│   └── tests/
│       └── test_scoring.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── styles.css
│   │   └── components/
│   │       ├── ReviewForm.jsx
│   │       ├── StarRating.jsx
│   │       ├── TrustCard.jsx
│   │       ├── Gauge.jsx
│   │       └── GradientMesh.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── LICENSE
├── NOTES.md
└── README.md
```

## Local setup

Backend:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```
Runs at `http://127.0.0.1:8000`, health check at `/health`.

Frontend (new terminal):
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Runs at `http://localhost:5173`.

Tests:
```bash
cd backend
pip install pytest --break-system-packages
pytest tests/ -v
```

## Deploy

### Backend on Render
- Root directory: `backend`
- Runtime: Python 3
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variable: `ALLOWED_ORIGINS`
- Python version is pinned in `backend/.python-version`

### Frontend on Vercel
- Root directory: `frontend`
- Framework preset: Vite
- Environment variable: `VITE_API_BASE_URL`, set to the Render backend URL

### Connect them
Set `ALLOWED_ORIGINS` on Render to the Vercel URL. Set `VITE_API_BASE_URL` on Vercel to the Render URL. Push to `main` to redeploy either side.

## Limitations

- Reviews are entered manually. There is no automatic lookup.
- Every flag is a heuristic signal, not proof.
- The sentiment lexicon is a small hand-built word list, not a trained model.
- Render's free tier sleeps when idle, first request after that is slow.

## Possible extensions

- Browser extension to pre-fill the form from a Maps page.
- Persist past analyses instead of losing them on refresh.
- Expand the sentiment lexicon.

See `NOTES.md` for design notes.
