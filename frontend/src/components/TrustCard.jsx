import React from "react";
import Gauge from "./Gauge";

const FLAG_LABELS = {
  generic_text: "generic text",
  sentiment_mismatch: "rating mismatch",
  timing_cluster: "timing cluster",
  anonymous_reviewer: "anonymous reviewer",
};

export default function TrustCard({ data }) {
  if (!data) return null;
  const { place, signal_report, reviews, disclaimer } = data;

  return (
    <div className="trust-card">
      <div className="trust-card-header">
        <h2>{place.name}</h2>
        {place.address && <div className="address">{place.address}</div>}
      </div>

      <div className="measurement-panel">
        <Gauge score={signal_report.signal_score} />
        <div>
          <div className="summary-text">{signal_report.summary}</div>
          <div className="sample-note">
            Based on the {signal_report.sample_size} review
            {signal_report.sample_size === 1 ? "" : "s"} you entered.
          </div>
          <div className="google-rating-block">
            Rating you noted from the listing
            <div className="value">
              {place.google_rating != null ? `${place.google_rating} ★` : "Not entered"}
              {place.google_rating_count != null ? ` · ${place.google_rating_count} ratings total` : ""}
            </div>
          </div>
        </div>
      </div>

      {signal_report.score_breakdown?.length > 0 && (
        <div className="breakdown">
          <h3>Signal breakdown</h3>
          {signal_report.score_breakdown.map((b) => (
            <div className="breakdown-row" key={b.signal}>
              <div className={`breakdown-count${b.count === 0 ? " zero" : ""}`}>{b.count}</div>
              <div className="breakdown-text">
                <div className="signal-name">{b.signal}</div>
                <div className="signal-explanation">{b.explanation}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviews?.length > 0 && (
        <div className="reviews-section">
          <h3>Reviews in this sample</h3>
          {reviews.map((r, i) => {
            const flags = signal_report.review_flags?.[i]?.flags || [];
            return (
              <div className="review-item" key={i}>
                <div className="review-top">
                  <span className="review-author">{r.author_name || "Anonymous"}</span>
                  <span className="review-meta">
                    {r.rating}★{r.date ? ` · ${r.date}` : ""}
                  </span>
                </div>
                {r.text && <div className="review-text">{r.text}</div>}
                {flags.length > 0 && (
                  <div className="flag-chips">
                    {flags.map((f) => (
                      <span className="flag-chip" key={f}>
                        {FLAG_LABELS[f] || f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {disclaimer && <div className="disclaimer">{disclaimer}</div>}
    </div>
  );
}
