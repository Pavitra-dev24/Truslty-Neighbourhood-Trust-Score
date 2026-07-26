"""
Unit tests for scoring.py, using hand-built mock review payloads shaped
like manually-entered reviews (the app's actual input now — no external
API or network access needed to run these).

Run with:  pytest
"""

import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import scoring  # noqa: E402


NOW = int(time.time())
DAY = 60 * 60 * 24


def make_review(rating, text, days_ago=None, author="Test User"):
    return {
        "rating": rating,
        "text": text,
        "time": (NOW - days_ago * DAY) if days_ago is not None else None,
        "author_name": author,
    }


def test_no_reviews_returns_none_score():
    result = scoring.analyze_reviews([])
    assert result["signal_score"] is None
    assert result["sample_size"] == 0


def test_clean_diverse_reviews_score_high():
    reviews = [
        make_review(5, "The staff were incredibly helpful and the coffee was fresh, "
                       "loved the quiet corner seating near the window.", 120),
        make_review(4, "Good spot for a quick working lunch, service was a little slow "
                       "on a Friday but the food quality made up for it.", 45),
        make_review(5, "Been coming here for years, the paneer tikka is consistently "
                       "excellent and the staff remember regulars by name.", 10),
    ]
    result = scoring.analyze_reviews(reviews)
    assert result["signal_score"] >= 75
    assert result["sample_size"] == 3


def test_generic_text_is_flagged():
    reviews = [
        make_review(5, "Good service", 5),
        make_review(5, "Nice place", 10),
        make_review(5, "The ambience was thoughtfully designed and the staff went out "
                       "of their way to accommodate a last-minute dietary request.", 60),
    ]
    result = scoring.analyze_reviews(reviews)
    generic_count = next(
        b["count"] for b in result["score_breakdown"] if b["signal"] == "Generic / templated text"
    )
    assert generic_count == 2


def test_sentiment_mismatch_is_flagged():
    reviews = [
        make_review(5, "Terrible service, rude staff, would never come back, awful experience.", 3),
        make_review(4, "Really enjoyed the food and the staff were friendly and prompt.", 20),
        make_review(3, "Average visit, nothing notable either way honestly speaking today.", 40),
    ]
    result = scoring.analyze_reviews(reviews)
    mismatch_count = next(
        b["count"] for b in result["score_breakdown"] if b["signal"] == "Rating / text mismatch"
    )
    assert mismatch_count == 1


def test_timing_cluster_is_flagged_when_dates_span_long_period():
    reviews = [
        make_review(5, "Great experience overall with attentive and quick service today.", 1),
        make_review(5, "Wonderful staff, fresh food, will definitely be returning again soon.", 1.5),
        make_review(4, "Solid place, would recommend to friends visiting the neighbourhood.", 90),
    ]
    result = scoring.analyze_reviews(reviews)
    cluster_count = next(
        b["count"] for b in result["score_breakdown"] if b["signal"] == "Clustered posting times"
    )
    assert cluster_count == 2  # the two 1-day-apart reviews


def test_timing_cluster_skips_gracefully_with_no_dates():
    reviews = [
        make_review(5, "Great experience overall with attentive and quick service today."),
        make_review(5, "Wonderful staff, fresh food, will definitely be returning again soon."),
        make_review(4, "Solid place, would recommend to friends visiting the neighbourhood."),
    ]
    result = scoring.analyze_reviews(reviews)
    cluster_count = next(
        b["count"] for b in result["score_breakdown"] if b["signal"] == "Clustered posting times"
    )
    assert cluster_count == 0


def test_anonymous_reviewer_is_flagged():
    reviews = [
        make_review(5, "Consistently good quality and friendly staff every single visit.", 10, author="A Google User"),
        make_review(4, "Solid experience, would come back again for the service quality.", 20, author=""),
        make_review(5, "Reliable neighbourhood spot with genuinely attentive staff members.", 30, author="Priya M."),
    ]
    result = scoring.analyze_reviews(reviews)
    anon_count = next(
        b["count"] for b in result["score_breakdown"] if b["signal"] == "Anonymous reviewer"
    )
    assert anon_count == 2


def test_score_is_bounded_0_to_100():
    reviews = [make_review(5, "ok", 1, author=None) for _ in range(5)]
    result = scoring.analyze_reviews(reviews)
    assert 0 <= result["signal_score"] <= 100


if __name__ == "__main__":
    import pytest
    raise SystemExit(pytest.main([__file__, "-v"]))
