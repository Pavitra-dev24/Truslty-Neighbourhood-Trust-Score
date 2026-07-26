"""
Review Signal Score
====================

A transparent, explainable heuristic that scores a small, user-pasted set
of reviews for a local business — not reviews fetched automatically from
any API. The person using this tool copies reviews in themselves (from
Google Maps or anywhere else), and gets a signal reading back.

The score is NOT a claim that a listing's reviews are fake. It is a set of
independently-explained signals a person can weigh for themselves, meant
to sit alongside whatever star rating they already see, never replace it.

Every signal below is intentionally simple and inspectable, in line with
this project's design goal: an explainable ranking layer, not a black-box
model.
"""

import re
import statistics
from dataclasses import dataclass, field

# --- tiny hand-built sentiment lexicon -------------------------------------
# Deliberately small and inspectable rather than pulling in a heavy NLP
# dependency for a solo demo project. Good enough to catch a clear mismatch
# between a review's words and its star rating; not a general-purpose
# sentiment engine.
POSITIVE_WORDS = {
    "good", "great", "excellent", "amazing", "awesome", "love", "loved",
    "best", "friendly", "clean", "fresh", "delicious", "tasty", "helpful",
    "recommend", "recommended", "fast", "polite", "wonderful", "perfect",
    "fantastic", "nice", "happy", "satisfied", "quality", "affordable",
    "beautiful", "comfortable", "courteous", "professional", "prompt",
}
NEGATIVE_WORDS = {
    "bad", "worst", "terrible", "awful", "horrible", "rude", "dirty",
    "slow", "cold", "stale", "overpriced", "disappointing", "disappointed",
    "poor", "waste", "avoid", "never", "worse", "unprofessional", "late",
    "broken", "damaged", "refund", "complaint", "complained", "scam",
    "cheated", "misbehaved", "unhygienic", "expired",
}

GENERIC_PHRASES = {
    "good service", "nice place", "good place", "highly recommend",
    "best in town", "value for money", "good food", "nice ambience",
    "great experience", "must visit", "good experience", "excellent service",
}

# Google's own placeholder for reviewer accounts with no name set, plus a
# few other common "not a real name" stand-ins someone might paste in.
ANONYMOUS_MARKERS = {"a google user", "google user", "anonymous", "user", "n/a"}


@dataclass
class ReviewFlag:
    review_index: int
    author: str
    flags: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)


def _word_set(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z']+", text.lower()))


def _is_generic(text: str) -> bool:
    normalized = text.strip().lower()
    if len(normalized) < 12:
        return True
    return any(phrase in normalized for phrase in GENERIC_PHRASES) and len(normalized) < 60


def _sentiment_mismatch(rating: int, text: str) -> bool:
    words = _word_set(text)
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    if pos == neg == 0:
        return False  # not enough signal either way — no claim made
    leaning_positive = pos > neg
    leaning_negative = neg > pos
    if rating >= 4 and leaning_negative:
        return True
    if rating <= 2 and leaning_positive:
        return True
    return False


def _is_anonymous_author(author_name: str | None) -> bool:
    if not author_name or not author_name.strip():
        return True
    return author_name.strip().lower() in ANONYMOUS_MARKERS


def _burst_flagged_indices(dated_reviews: list[tuple[int, int]]) -> set[int]:
    """
    dated_reviews: (review_index, unix_timestamp) pairs, only for reviews
    where a date was actually provided — dates are optional on manual
    entry, so this check simply skips itself when too few dates are given.

    Flags reviews that landed within 48 hours of another dated review in
    the sample, when the dated sample as a whole spans much longer. This
    is a weak signal on a small, self-reported sample by design.
    """
    if len(dated_reviews) < 3:
        return set()

    order = sorted(dated_reviews, key=lambda pair: pair[1])
    total_span = order[-1][1] - order[0][1]
    if total_span < 60 * 60 * 24 * 14:
        # Everything already landed within two weeks — clustering isn't a
        # meaningful outlier signal on a sample this size or this fresh.
        return set()

    flagged = set()
    two_days = 60 * 60 * 24 * 2
    for (idx_a, t_a), (idx_b, t_b) in zip(order, order[1:]):
        if t_b - t_a <= two_days:
            flagged.add(idx_a)
            flagged.add(idx_b)
    return flagged


def analyze_reviews(reviews: list[dict]) -> dict:
    """
    Takes a list of manually-entered reviews — each a dict with at least
    `rating` (1-5) and `text`, and optionally `author_name` and `time`
    (unix timestamp, or None if no date was given) — and returns a
    structured, explainable signal report.
    """
    if not reviews:
        return {
            "signal_score": None,
            "sample_size": 0,
            "summary": "No reviews were entered, so no signal score could be computed.",
            "review_flags": [],
            "score_breakdown": [],
        }

    dated = [(i, r["time"]) for i, r in enumerate(reviews) if r.get("time") is not None]
    dates_provided = len(dated)
    burst_indices = _burst_flagged_indices(dated)

    review_flags: list[ReviewFlag] = []
    penalty_total = 0.0

    for i, r in enumerate(reviews):
        rating = r.get("rating", 0)
        text = r.get("text", "") or ""
        author = r.get("author_name") or "Anonymous"

        rf = ReviewFlag(review_index=i, author=author)
        review_penalty = 0.0

        if _is_generic(text):
            rf.flags.append("generic_text")
            rf.notes.append("Short or template-like text with little specific detail.")
            review_penalty += 6

        if _sentiment_mismatch(rating, text):
            rf.flags.append("sentiment_mismatch")
            rf.notes.append(
                f"{rating}-star rating reads inconsistently with the wording used."
            )
            review_penalty += 10

        if i in burst_indices:
            rf.flags.append("timing_cluster")
            rf.notes.append(
                "Posted within 48 hours of another review in this sample, "
                "despite the sample spanning a much longer period overall."
            )
            review_penalty += 8

        if _is_anonymous_author(r.get("author_name")):
            rf.flags.append("anonymous_reviewer")
            rf.notes.append(
                "No real reviewer name given — blank, or a generic "
                "placeholder like \"A Google User\"."
            )
            review_penalty += 4

        penalty_total += review_penalty
        review_flags.append(rf)

    n = len(reviews)
    # Normalise: a handful of small, independent flags shouldn't crater the
    # score, but a review carrying most/all flags at once should stand out.
    raw_score = 100 - (penalty_total / n) * 2.1
    signal_score = max(0, min(100, round(raw_score)))

    ratings = [r.get("rating", 0) for r in reviews]
    rating_spread = round(statistics.pstdev(ratings), 2) if len(ratings) > 1 else 0.0

    timing_note = (
        "Reviews posted within 48 hours of each other inside an otherwise "
        "much longer time span — worth noting, but a weak signal on a "
        "sample this small."
        if dates_provided >= 3
        else "Not enough review dates were entered to check this (add "
             "dates to at least 3 reviews to enable it)."
    )

    breakdown = [
        {
            "signal": "Generic / templated text",
            "count": sum(1 for rf in review_flags if "generic_text" in rf.flags),
            "explanation": "Very short reviews or ones that closely match common "
                           "template phrases, which carry little specific "
                           "information about this particular business.",
        },
        {
            "signal": "Rating / text mismatch",
            "count": sum(1 for rf in review_flags if "sentiment_mismatch" in rf.flags),
            "explanation": "The star rating and the wording of the review text "
                           "point in different directions.",
        },
        {
            "signal": "Clustered posting times",
            "count": sum(1 for rf in review_flags if "timing_cluster" in rf.flags),
            "explanation": timing_note,
        },
        {
            "signal": "Anonymous reviewer",
            "count": sum(1 for rf in review_flags if "anonymous_reviewer" in rf.flags),
            "explanation": "Reviewer name was left blank, or is a generic "
                           "placeholder like \"A Google User\" — Google's own "
                           "label for accounts with no name set. A weak, "
                           "non-definitive signal on its own.",
        },
    ]

    return {
        "signal_score": signal_score,
        "sample_size": n,
        "rating_spread": rating_spread,
        "summary": _summary_text(signal_score, n),
        "review_flags": [
            {
                "review_index": rf.review_index,
                "author": rf.author,
                "flags": rf.flags,
                "notes": rf.notes,
            }
            for rf in review_flags
        ],
        "score_breakdown": breakdown,
    }


def _summary_text(score: int, n: int) -> str:
    if n < 3:
        return (
            f"Only {n} review(s) were entered — too small a sample for the "
            "signal score to be very meaningful. Treat it as a starting "
            "point, not a verdict."
        )
    if score >= 80:
        return "Few or no signal flags across the reviews you entered."
    if score >= 55:
        return "A handful of signal flags worth a quick look, but nothing overwhelming."
    return "Multiple signal flags across this review sample — worth reading them yourself before deciding."
