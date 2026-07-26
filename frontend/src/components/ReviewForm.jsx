import React, { useState } from "react";
import StarRating from "./StarRating";

let nextId = 1;
const newRow = () => ({ id: nextId++, author_name: "", rating: 5, text: "", date: "" });

export default function ReviewForm({ onSubmit, loading }) {
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [googleRating, setGoogleRating] = useState("");
  const [googleRatingCount, setGoogleRatingCount] = useState("");
  const [rows, setRows] = useState([newRow(), newRow(), newRow()]);

  function updateRow(id, patch) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, newRow()]);
  }

  function removeRow(id) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const reviews = rows
      .filter((r) => r.text.trim().length > 0)
      .map((r) => ({
        author_name: r.author_name.trim() || null,
        rating: r.rating,
        text: r.text.trim(),
        date: r.date || null,
      }));
    if (reviews.length === 0) return;

    onSubmit({
      business_name: businessName.trim() || null,
      business_address: businessAddress.trim() || null,
      google_rating: googleRating ? parseFloat(googleRating) : null,
      google_rating_count: googleRatingCount ? parseInt(googleRatingCount, 10) : null,
      reviews,
    });
  }

  const validCount = rows.filter((r) => r.text.trim().length > 0).length;

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="form-section-label">Entry — the listing</div>
      <div className="business-fields">
        <input
          type="text"
          placeholder="Business name (optional)"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Address (optional)"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
        />
        <input
          type="number"
          step="0.1"
          min="0"
          max="5"
          placeholder="Google rating (optional)"
          value={googleRating}
          onChange={(e) => setGoogleRating(e.target.value)}
        />
        <input
          type="number"
          min="0"
          placeholder="Total ratings (optional)"
          value={googleRatingCount}
          onChange={(e) => setGoogleRatingCount(e.target.value)}
        />
      </div>

      <div className="form-section-label">Entry — the reviews</div>
      <div className="form-hint">
        Copy these straight from wherever you're reading them. Reviewer name and date are
        optional, but a date on at least 3 reviews enables the timing-cluster check.
      </div>

      {rows.map((row, i) => (
        <div className="review-row" key={row.id}>
          <div className="review-row-header">
            <span className="review-row-index">Review {i + 1}</span>
            <StarRating value={row.rating} onChange={(v) => updateRow(row.id, { rating: v })} />
            <button
              type="button"
              className="remove-row-btn"
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              aria-label="Remove this review"
            >
              ✕
            </button>
          </div>
          <div className="review-row-fields">
            <input
              type="text"
              placeholder="Reviewer name (optional)"
              value={row.author_name}
              onChange={(e) => updateRow(row.id, { author_name: e.target.value })}
            />
            <input
              type="date"
              value={row.date}
              onChange={(e) => updateRow(row.id, { date: e.target.value })}
              aria-label="Review date (optional)"
            />
          </div>
          <textarea
            placeholder="Paste the review text here"
            value={row.text}
            onChange={(e) => updateRow(row.id, { text: e.target.value })}
            rows={2}
          />
        </div>
      ))}

      <div className="form-actions">
        <button type="button" className="add-row-btn" onClick={addRow}>
          + Add another review
        </button>
        <button type="submit" className="submit-btn" disabled={loading || validCount === 0}>
          {loading ? "Analyzing…" : `Analyze ${validCount || ""} review${validCount === 1 ? "" : "s"}`}
        </button>
      </div>
    </form>
  );
}
