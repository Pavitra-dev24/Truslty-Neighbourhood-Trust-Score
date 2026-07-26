"""
Neighbourhood Trust Score — backend API.

One endpoint:
  POST /api/analyze — takes a business name/address (optional, just for
  display) plus a list of manually-entered reviews, and returns an
  explainable review-signal score.

No external API calls, no API key, no billing account required — this
app never fetches anything automatically. The person using it pastes
reviews in themselves (from Google Maps or anywhere else), and everything
runs on this backend's own logic.

Run locally:
  uvicorn main:app --reload

Deploy: see ../README.md for the Render walkthrough.
"""

import os
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import scoring

app = FastAPI(
    title="Neighbourhood Trust Score API",
    description="Explainable review-signal scoring on reviews you paste in "
                "yourself. A solo, non-commercial demo project with no "
                "external API dependency.",
    version="2.0.0",
)

# --- CORS -------------------------------------------------------------
# ALLOWED_ORIGINS is a comma-separated list, e.g.
#   ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
# Defaults to "*" so the app works out of the box locally; tighten this
# once your Vercel URL exists (see README "Connecting frontend & backend").
_origins_env = os.environ.get("ALLOWED_ORIGINS", "*")
allow_origins = ["*"] if _origins_env.strip() == "*" else [
    o.strip() for o in _origins_env.split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ReviewInput(BaseModel):
    author_name: Optional[str] = Field(None, max_length=200)
    rating: int = Field(..., ge=1, le=5)
    text: str = Field(..., min_length=1, max_length=5000)
    date: Optional[str] = Field(
        None, description="Optional ISO date, e.g. '2026-05-01'. Improves "
                           "the timing-cluster check but isn't required."
    )


class AnalyzeRequest(BaseModel):
    business_name: Optional[str] = Field(None, max_length=200)
    business_address: Optional[str] = Field(None, max_length=300)
    google_rating: Optional[float] = Field(
        None, ge=0, le=5, description="Optional — type in the star rating "
                                       "you see on Maps, purely for display."
    )
    google_rating_count: Optional[int] = Field(None, ge=0)
    reviews: list[ReviewInput]


def _parse_date(date_str: Optional[str]) -> Optional[int]:
    """Best-effort parse of a user-typed date into a unix timestamp.
    Returns None on anything blank or unparseable — the scoring logic
    already treats a missing date as 'skip this review for the timing
    check', so we fail soft rather than rejecting the request."""
    if not date_str or not date_str.strip():
        return None
    try:
        return int(datetime.fromisoformat(date_str.strip()).timestamp())
    except ValueError:
        return None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
def analyze(payload: AnalyzeRequest):
    if not payload.reviews:
        raise HTTPException(
            status_code=400,
            detail="Add at least one review to analyze.",
        )

    raw_reviews = [
        {
            "author_name": r.author_name,
            "rating": r.rating,
            "text": r.text,
            "time": _parse_date(r.date),
        }
        for r in payload.reviews
    ]

    signal_report = scoring.analyze_reviews(raw_reviews)

    return {
        "place": {
            "name": payload.business_name or "Untitled listing",
            "address": payload.business_address,
            "google_rating": payload.google_rating,
            "google_rating_count": payload.google_rating_count,
        },
        "signal_report": signal_report,
        "reviews": [
            {
                "author_name": r.author_name or "Anonymous",
                "rating": r.rating,
                "text": r.text,
                "date": r.date,
            }
            for r in payload.reviews
        ],
        "disclaimer": (
            "Computed only from the reviews you entered — nothing was "
            "fetched automatically. This is a heuristic signal for your "
            "own judgement, not a claim that any review is fake."
        ),
    }
