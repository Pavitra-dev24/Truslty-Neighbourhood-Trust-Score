# Trustly — Neighbourhood Trust Score

![Live](https://img.shields.io/website?url=https%3A%2F%2Fneighbourhood-trust-score.vercel.app&label=live)
![Python](https://img.shields.io/badge/python-3.12-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)

A tool that scores reviews for a local business using a set of explainable signals: generic text, rating and text mismatches, clustered posting dates, and anonymous reviewer names. Reviews are pasted in manually, nothing is fetched automatically, so there is no external API or billing account involved.

Live: https://neighbourhood-trust-score.vercel.app/

## Highlights

- Decoupled frontend and backend, deployed and scaled independently on Vercel and Render.
- Explainable scoring engine. Every flag traces back to a specific, documented rule, no black-box model.
- Zero external API dependency by design, so the project needs no third-party billing credentials to run.
- Backend covered by an automated pytest suite, run on every push through GitHub Actions.

## What it does

Enter a business name and a handful of reviews. The backend runs them through independent checks and returns a signal score plus a breakdown of what triggered it. It does not claim any review is fake, it surfaces signals for you to judge alongside the star rating you already see.

## How the scoring engine works

The engine runs four independent checks against each review. A check that fires adds a fixed penalty to that specific review. Penalties are averaged across the sample and converted into a single 0 to 100 score. Nothing here is machine learning, every number below is a fixed rule in `scoring.py`.

### 1. Generic text
A review is flagged if its text is under 12 characters, or if it matches one of a short list of template phrases ("good service", "nice place", "highly recommend", and similar) while still under 60 characters. Catches low-effort reviews that carry no specific information about the business. Penalty: 6.

### 2. Rating and text mismatch
A hand-built lexicon of about 30 positive words and 30 negative words is matched word-for-word against the review text. If the rating is 4 or 5 but negative words outnumber positive ones, or the rating is 1 or 2 but positive words outnumber negative ones, the review is flagged. Reviews with no lexicon matches on either side are left alone rather than guessed at, since there is not enough signal to call it either way. Penalty: 10.

### 3. Clustered posting times
Only runs on reviews that have a date attached, and only if at least 3 reviews in the sample have one. Dated reviews are sorted by timestamp. If the full dated sample spans less than 14 days, the check is skipped entirely, since clustering is not a meaningful outlier signal on a sample that is naturally all recent. Otherwise, any two reviews posted within 48 hours of each other are both flagged. Penalty: 8 per review involved.

### 4. Anonymous reviewer
A review is flagged if the reviewer name is left blank or matches a known placeholder, including Google's own default label "A Google User" for accounts with no name set. Penalty: 4.

### Final score
```
raw_score = 100 - (total_penalty / review_count) * 2.1
signal_score = clamp(round(raw_score), 0, 100)
```
A score of 80 or above reads as Clean, 55 to 79 as Mixed, below 55 as Flagged. Samples smaller than 3 reviews get a separate note that the sample is too small to be meaningful, regardless of what the score comes out to.

The API returns which specific rule triggered on each review, not just the final number, so the frontend can show the reasoning next to the score rather than asking for trust in a black box.

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

## Possible extensions

- Browser extension to pre-fill the form from a Maps page.
- Persist past analyses instead of losing them on refresh.
- Expand the sentiment lexicon.

See `NOTES.md` for design notes.
