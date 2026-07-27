# Truslty - Neighbourhood Trust Score

A second reading on a local business's reviews — computed from reviews
**you paste in yourself**, shown alongside whatever star rating you
already see, not instead of it. Built as a solo, non-commercial portfolio
project for the Google Software Application Development Apprenticeship
(India, March 2027).

**Live demo:** add your deployed URLs here once live.
- Frontend (Vercel): `https://your-app.vercel.app`
- Backend (Render): `https://your-app.onrender.com`

---

## What this is, and isn't

This is an **explainable review-signal tool**, not a fake-review
detector. It surfaces a small set of transparent signals — clustered
posting dates, star-rating vs. text mismatches, generic/templated text,
anonymous reviewer names — computed from reviews you copy in yourself.
It never claims a review is fake, and it always shows the rating you
noted from wherever you found the reviews, alongside its own reading.

**Why paste-in, and not a live lookup:** the original design fetched
reviews automatically from Google's Places API. That works, but Google
requires a billing account — and a real payment method on file — before
issuing any API key at all, even for usage that will always cost $0.
Rather than ask anyone running this project to hand over card details
for a demo app, the design was changed to need **no external API at
all**: you copy reviews in from wherever you're reading them (Google
Maps or anywhere else), and every calculation runs on this project's own
backend. That's not a workaround — it's arguably a better fit for a
solo, non-commercial tool, and being able to explain that trade-off is
part of the point. See `NOTES.md` for the fuller story.

## Architecture

```
┌─────────────────┐         HTTPS          ┌──────────────────┐
│  Frontend        │  ───────────────────▶  │  Backend          │
│  React + Vite     │  ◀───────────────────  │  FastAPI (Python) │
│  on Vercel         │      JSON             │  on Render         │
└─────────────────┘                         └──────────────────┘
```

No external API, no API key, no billing account, anywhere in this
stack. The backend's only job is running the scoring logic in
`scoring.py` on whatever reviews the frontend sends it.

- **Backend** (`/backend`) — a small FastAPI app with one endpoint
  (`POST /api/analyze`) and the scoring logic in `scoring.py`.
- **Frontend** (`/frontend`) — a React + Vite single-page app. A form
  for entering business info and a handful of reviews, and a result view
  with a hand-built SVG "trust dial" gauge (no charting library).

---

## Repository structure

```
neighbourhood-trust-score/
├── backend/
│   ├── main.py              # FastAPI app + the one POST /api/analyze route
│   ├── scoring.py           # explainable review-signal scoring logic
│   ├── requirements.txt
│   ├── render.yaml          # optional Render blueprint
│   ├── .python-version      # pins the Python version Render builds with
│   ├── .env.example
│   └── tests/
│       └── test_scoring.py  # unit tests, no network access needed
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── styles.css
│   │   └── components/
│   │       ├── ReviewForm.jsx   # business info + review entry rows
│   │       ├── StarRating.jsx
│   │       ├── TrustCard.jsx
│   │       └── Gauge.jsx        # the signature SVG dial
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── README.md                 # you are here
```

---

## 1. Run it locally first

Get both sides working locally before touching Render or Vercel — it's
much easier to debug a CORS issue on your own machine. No API key setup
needed at any point.

**Backend:**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
cp .env.example .env   # the default ALLOWED_ORIGINS is already correct locally
uvicorn main:app --reload
```
Visit `http://127.0.0.1:8000/health` — you should see `{"status":"ok"}`.

**Frontend** (new terminal):
```bash
cd frontend
npm install
cp .env.example .env
# the default VITE_API_BASE_URL=http://127.0.0.1:8000 is already correct locally
npm run dev
```
Visit the URL Vite prints (usually `http://localhost:5173`), fill in a
few reviews, and confirm you get a signal score back.

**Run the backend tests** (no network needed):
```bash
cd backend
pip install pytest --break-system-packages   # if not already installed
pytest tests/ -v
```

---

## 2. Push to GitHub

Both Render and Vercel deploy from a GitHub repo.

```bash
cd neighbourhood-trust-score
git init
git add .
git commit -m "Initial commit: Neighbourhood Trust Score"
```
Create a new empty repo on GitHub, then:
```bash
git remote add origin https://github.com/<your-username>/neighbourhood-trust-score.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy the backend to Render

1. Go to [render.com](https://render.com) and sign in (GitHub sign-in is easiest).
2. **New → Web Service**, connect your GitHub account, and select this repo.
3. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free is fine for a demo project.
4. Under **Environment**, add just one variable:
   - `ALLOWED_ORIGINS` = `*` for now — you'll tighten this in Step 5, once the Vercel URL exists
5. Click **Create Web Service**. Render will build and deploy; watch the logs for errors.
6. Once live, note your backend URL — something like `https://neighbourhood-trust-score-api.onrender.com`.
7. Confirm it works: visit `https://<your-render-url>/health` in a browser — you should see `{"status":"ok"}`.

*(There's also a `render.yaml` in `/backend` if you'd rather use Render's "Blueprint" one-click setup instead of the manual steps above — either works.)*

**Python version note:** `backend/.python-version` pins the build to Python 3.12 — the version this project was actually tested against. Render changed the default Python version for newly-created services to 3.14.3 in February 2026, and the pinned package versions in `requirements.txt` predate that release, so leaving the version unpinned risks a build failure on a fresh service. If you ever want to move to a newer Python version, update this file and re-test locally first.

**Free-tier note:** Render's free web services spin down after a period
of inactivity and take 30–60 seconds to wake up on the next request.
That's expected — the first request after idle time will just be slow,
not broken.

---

## 4. Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub sign-in is easiest).
2. **Add New → Project**, and import the same GitHub repo.
3. Configure the project:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (Vercel should auto-detect this)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default for Vite)
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = your Render URL from Step 3 (e.g. `https://neighbourhood-trust-score-api.onrender.com`) — **no trailing slash**
5. Click **Deploy**. Vercel will build and give you a URL like `https://neighbourhood-trust-score.vercel.app`.

---

## 5. Connect them properly

At this point the frontend can technically reach the backend, but the
backend's CORS is still wide open (`ALLOWED_ORIGINS=*`). Lock it down to
your actual frontend:

1. Back in **Render**, open your backend service → **Environment**.
2. Change `ALLOWED_ORIGINS` from `*` to your real Vercel URL, e.g.:
   ```
   ALLOWED_ORIGINS=https://neighbourhood-trust-score.vercel.app
   ```
   (Comma-separate multiple origins if you also want to allow `http://localhost:5173` for continued local testing.)
3. Save — Render will automatically redeploy the backend with the new setting.
4. Open your live Vercel URL, enter a few reviews, and confirm the full flow works end to end: form → analysis → gauge + breakdown.

If something doesn't connect, check your browser's DevTools **Network**
and **Console** tabs first — a CORS error there means step 5.2 above
hasn't finished redeploying yet, or the URL has a typo (http vs https,
trailing slash, etc).

---

## 6. Keeping both sides in sync going forward

Whenever you push a change to `main` on GitHub, both Render and Vercel
will automatically rebuild and redeploy — no extra steps needed after
the initial setup above.

---

## Limitations (worth being upfront about, including in an interview)

- **Manual entry only.** There is no automatic lookup — every review has
  to be copied in by hand. That's a deliberate trade-off (see `NOTES.md`),
  not an oversight.
- **Heuristic, not proof.** Every flag (generic text, timing cluster,
  sentiment mismatch, anonymous reviewer) is a weak, independent signal,
  not a verdict. The UI is worded to reflect that.
- **Small hand-built sentiment lexicon.** `scoring.py`'s word list is
  intentionally simple and inspectable, not a trained model — it will
  miss nuance a real NLP model would catch.
- **Free-tier hosting.** Render's free tier sleeps when idle; this is a
  demo/portfolio deployment, not a production SLA.

## Possible next steps

- A small browser bookmarklet or extension that pre-fills the form from
  a Google Maps page's visible reviews, to cut down on manual retyping
  without ever calling a paid API.
- Add a small SQLite layer to save and revisit past analyses rather than
  losing them on refresh.
- Extend or swap the sentiment lexicon if it proves too coarse on real
  reviews you test it against.
