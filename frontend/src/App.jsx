import React, { useState } from "react";
import ReviewForm from "./components/ReviewForm";
import TrustCard from "./components/TrustCard";
import { analyzeReviews } from "./api";

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(payload) {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const data = await analyzeReviews(payload);
      setAnalysis(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="eyebrow">Review signal survey</div>
        <h1>Neighbourhood Trust Score</h1>
        <p>
          Paste in a business's reviews and get a second, transparent reading on them —
          alongside whatever star rating you already see, not instead of it. Nothing is
          fetched automatically; everything below is what you typed in.
        </p>
      </header>

      <ReviewForm onSubmit={handleSubmit} loading={loading} />

      {error && <div className="error-banner">{error}</div>}

      {loading && <div className="loading-text">Reading reviews…</div>}

      {analysis && <TrustCard data={analysis} />}

      <footer className="site-footer">
        Solo, non-commercial demo project. Signal scores are heuristic and explainable, not a
        claim that any individual review is fake. See{" "}
        <a href="https://github.com" target="_blank" rel="noreferrer">
          the project README
        </a>{" "}
        for how the score is computed.
      </footer>
    </div>
  );
}
