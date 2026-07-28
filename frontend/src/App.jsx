import React, { useState } from "react";
import ReviewForm from "./components/ReviewForm";
import TrustCard from "./components/TrustCard";
import GradientMesh from "./components/GradientMesh";
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
    <div className="page">
      <div className="hero">
        <GradientMesh />
        <div className="hero-content">
          <div className="pill-tag-soft">Review signal survey</div>
          <h1>Trustly — Neighbourhood Trust Score</h1>
          <p>
            Paste in a business's reviews and get a second, transparent reading on them, 
            alongside whatever star rating you already see, not instead of it. Nothing is
            fetched automatically; everything below is what you typed in.
          </p>
        </div>
      </div>

      <div className="app-shell">
        <ReviewForm onSubmit={handleSubmit} loading={loading} />

        {error && <div className="error-banner">{error}</div>}

        {loading && <div className="loading-text">Reading reviews…</div>}

        {analysis && <TrustCard data={analysis} />}
      </div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          Signal scores are explainable, not
          a claim that any individual review is fake. See{" "}
          <a href="https://github.com/Pavitra-dev24/Truslty-Neighbourhood-Trust-Score" target="_blank" rel="noreferrer">
            Project README
          </a>{" "}
          for how the score is computed.
        </div>
      </footer>
    </div>
  );
}
