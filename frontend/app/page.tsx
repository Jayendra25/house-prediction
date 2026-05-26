"use client";

import { useState, type FormEvent } from "react";

/* ──────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────── */

interface HouseFormData {
  living_area: string;
  bedrooms: string;
  bathrooms: string;
  built_year: string;
  postal_code: string;
  grade: string;
  condition: string;
  distance_from_airport: string;
  schools_nearby: string;
}

interface PredictionResponse {
  predicted_price: number;
  currency: string;
  input_data: Record<string, number>;
}

/* ──────────────────────────────────────────────
   FIELD CONFIG
   ────────────────────────────────────────────── */

interface FieldConfig {
  key: keyof HouseFormData;
  label: string;
  placeholder: string;
  icon: string;
  unit?: string;
  helperText?: string;
  step?: string;
  min?: string;
  max?: string;
}

const FIELDS: FieldConfig[] = [
  { key: "living_area", label: "Living Area", placeholder: "1500", icon: "◻", unit: "sq.ft", min: "1" },
  { key: "bedrooms", label: "Bedrooms", placeholder: "3", icon: "◫", min: "0", step: "1" },
  { key: "bathrooms", label: "Bathrooms", placeholder: "2", icon: "◎", min: "0", step: "0.5" },
  { key: "built_year", label: "Built Year", placeholder: "2010", icon: "◷", min: "1801", max: "2026", step: "1" },
  { key: "postal_code", label: "Postal Code", placeholder: "122004", icon: "◉", helperText: "e.g. 122004", step: "1" },
  { key: "grade", label: "Grade", placeholder: "8", icon: "◈", min: "1", max: "13", step: "1", unit: "/13" },
  { key: "condition", label: "Condition", placeholder: "3", icon: "◇", min: "1", max: "5", step: "1", unit: "/5" },
  { key: "distance_from_airport", label: "Airport Distance", placeholder: "50", icon: "◁", min: "0", unit: "km" },
  { key: "schools_nearby", label: "Schools Nearby", placeholder: "2", icon: "◆", min: "0", step: "1" },
];

const INITIAL_FORM: HouseFormData = {
  living_area: "", bedrooms: "", bathrooms: "", built_year: "",
  postal_code: "", grade: "", condition: "", distance_from_airport: "", schools_nearby: "",
};

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

/* ──────────────────────────────────────────────
   INLINE STYLES
   ────────────────────────────────────────────── */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0a0a0f;
    --paper: #f5f0e8;
    --paper-dim: #ede8d8;
    --amber: #e8a000;
    --amber-light: #ffc840;
    --amber-pale: #fff4d6;
    --rust: #c43b1a;
    --forest: #1a5c3a;
    --slate: #2a2d3a;
    --muted: #6b6878;
    --border: rgba(10,10,15,0.12);
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  html, body { height: 100%; }

  body {
    background-color: var(--paper);
    color: var(--ink);
    font-family: var(--font-display);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,160,0,0.12) 0%, transparent 70%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 0v60M0 30h60' stroke='rgba(10,10,15,0.04)' stroke-width='1'/%3E%3C/svg%3E");
    min-height: 100vh;
  }

  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 60px 20px 80px;
  }

  /* ── HEADER ── */
  .header {
    width: 100%;
    max-width: 700px;
    margin-bottom: 48px;
    position: relative;
  }

  .header-eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .eyebrow-line {
    height: 2px;
    width: 32px;
    background: var(--amber);
  }

  .eyebrow-text {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .header-title {
    font-family: var(--font-display);
    font-size: clamp(38px, 7vw, 62px);
    font-weight: 800;
    line-height: 1.0;
    letter-spacing: -0.03em;
    color: var(--ink);
  }

  .header-title .accent {
    color: var(--amber);
    position: relative;
  }

  .header-title .accent::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--amber);
    opacity: 0.3;
  }

  .header-subtitle {
    margin-top: 16px;
    font-family: var(--font-mono);
    font-size: 14px;
    color: var(--muted);
    line-height: 1.6;
  }

  .header-tag {
    margin-top: 20px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: var(--ink);
    color: var(--amber-light);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    border-radius: 2px;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--amber-light);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* ── CARD ── */
  .card {
    width: 100%;
    max-width: 700px;
    background: white;
    border: 2px solid var(--ink);
    border-radius: 4px;
    box-shadow: 8px 8px 0 var(--ink);
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--amber) 0%, var(--amber-light) 100%);
  }

  .card-inner {
    padding: 36px;
  }

  /* ── SECTION LABEL ── */
  .section-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── GRID ── */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 20px;
    margin-bottom: 28px;
  }

  @media (max-width: 520px) {
    .form-grid { grid-template-columns: 1fr; }
    .card-inner { padding: 24px; }
  }

  /* ── FIELD ── */
  .field {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .field-icon {
    font-style: normal;
    color: var(--amber);
    font-size: 13px;
  }

  .field-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    border: 1.5px solid var(--border);
    background: var(--paper);
    border-radius: 3px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .field-input-wrap:focus-within {
    border-color: var(--amber);
    box-shadow: 0 0 0 3px rgba(232,160,0,0.12);
    background: white;
  }

  .field-input-wrap.error {
    border-color: var(--rust);
    box-shadow: 0 0 0 3px rgba(196,59,26,0.1);
  }

  .field-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 12px;
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 400;
    color: var(--ink);
    outline: none;
    width: 100%;
  }

  .field-input::placeholder {
    color: #b8b4a8;
  }

  /* Hide number spinners */
  .field-input::-webkit-outer-spin-button,
  .field-input::-webkit-inner-spin-button { -webkit-appearance: none; }
  .field-input[type=number] { -moz-appearance: textfield; }

  .field-unit {
    padding: 0 12px 0 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    white-space: nowrap;
    pointer-events: none;
  }

  .field-helper {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    margin-top: 5px;
  }

  .field-error {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--rust);
    margin-top: 5px;
  }

  /* ── DIVIDER ── */
  .divider {
    border: none;
    height: 1px;
    background: var(--border);
    margin: 24px 0;
  }

  /* ── SUBMIT BUTTON ── */
  .btn-submit {
    width: 100%;
    padding: 14px 24px;
    background: var(--ink);
    color: var(--amber-light);
    border: 2px solid var(--ink);
    border-radius: 3px;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, transform 0.1s, box-shadow 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 4px 4px 0 var(--amber);
    position: relative;
    overflow: hidden;
  }

  .btn-submit:hover:not(:disabled) {
    background: var(--amber);
    color: var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
  }

  .btn-submit:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--amber);
  }

  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Spinner */
  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── ERROR BANNER ── */
  .error-banner {
    margin-top: 20px;
    padding: 14px 16px;
    background: #fff4f2;
    border: 1.5px solid #f9c4ba;
    border-left: 4px solid var(--rust);
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--rust);
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  /* ── RESULT ── */
  .result {
    margin-top: 20px;
    padding: 28px 24px;
    background: var(--ink);
    border-radius: 3px;
    text-align: center;
    animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
    position: relative;
    overflow: hidden;
  }

  .result::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 100%, rgba(232,160,0,0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .result-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 12px;
  }

  .result-price {
    font-family: var(--font-display);
    font-size: clamp(32px, 6vw, 52px);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: white;
    line-height: 1;
    margin-bottom: 16px;
  }

  .result-price .currency {
    font-size: 0.55em;
    vertical-align: 0.2em;
    font-weight: 600;
    color: var(--amber-light);
    margin-right: 2px;
  }

  .result-bar {
    height: 3px;
    background: linear-gradient(90deg, var(--amber) 0%, var(--amber-light) 100%);
    border-radius: 2px;
    margin: 0 auto 16px;
    width: 60px;
  }

  .result-disclaimer {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    max-width: 340px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* ── FOOTER ── */
  .footer {
    margin-top: 32px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .footer-dot {
    width: 3px;
    height: 3px;
    background: var(--muted);
    border-radius: 50%;
  }

  /* ── PROGRESS INDICATOR ── */
  .progress-track {
    margin-bottom: 28px;
    background: var(--paper-dim);
    border-radius: 2px;
    height: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--amber) 0%, var(--amber-light) 100%);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .progress-label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
  }
`;

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */

export default function Home() {
  const [formData, setFormData] = useState<HouseFormData>(INITIAL_FORM);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: keyof HouseFormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const filledCount = Object.values(formData).filter(Boolean).length;
  const totalFields = FIELDS.length;
  const progress = Math.round((filledCount / totalFields) * 100);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    const payload = {
      living_area: parseFloat(formData.living_area),
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseFloat(formData.bathrooms),
      built_year: parseInt(formData.built_year),
      postal_code: parseInt(formData.postal_code),
      grade: parseInt(formData.grade),
      condition: parseInt(formData.condition),
      distance_from_airport: parseFloat(formData.distance_from_airport),
      schools_nearby: parseInt(formData.schools_nearby),
    };

    try {
      const res = await fetch("/api/save-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.detail || `Server error (${res.status})`);
      }
      const data: PredictionResponse = await res.json();
      setPrediction(data);

      try {
        await fetch("/api/save-prediction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            predicted_price: data.predicted_price,
          }),
        });
      } catch (dbError) {
        console.error("Failed to save to database:", dbError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Format price with separate currency sign
  function renderPrice(amount: number) {
    const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
    return (
      <div className="result-price">
        <span className="currency">₹</span>{formatted}
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="page">
        {/* Header */}
        <div className="header">
          <div className="header-eyebrow">
            <div className="eyebrow-line" />
            <span className="eyebrow-text">Property Valuation Tool</span>
          </div>
          <h1 className="header-title">
            House<br />
            <span className="accent">Price</span> Estimate
          </h1>
          <p className="header-subtitle">
            ML-powered property valuation for Indian real estate markets.
          </p>
          <div className="header-tag">
            <div className="pulse-dot" />
            Random Forest Regressor · FastAPI
          </div>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-inner">

            {/* Progress */}
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-label">
              <span>Property Details</span>
              <span>{filledCount}/{totalFields} fields</span>
            </div>

            <hr className="divider" />

            <form onSubmit={handleSubmit}>
              <div className="section-label">Input Parameters</div>

              <div className="form-grid">
                {FIELDS.map((field) => {
                  const isPostal = field.key === "postal_code";
                  return (
                    <div key={field.key} className="field">
                      <label htmlFor={field.key} className="field-label">
                        <i className="field-icon">{field.icon}</i>
                        {field.label}
                      </label>
                      <div className="field-input-wrap">
                        <input
                          id={field.key}
                          type="number"
                          required
                          value={formData[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          step={field.step}
                          min={field.min}
                          max={field.max}
                          className="field-input"
                        />
                        {field.unit && <span className="field-unit">{field.unit}</span>}
                      </div>
                      {field.helperText && (
                        <span className="field-helper">{field.helperText}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <hr className="divider" />

              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? (
                  <>
                    <div className="spinner" />
                    Calculating estimate…
                  </>
                ) : (
                  <>
                    Predict Price
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 2 }}>
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="error-banner">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {/* Result */}
            {prediction && (
              <div className="result">
                <div className="result-eyebrow">Estimated Market Value</div>
                {renderPrice(prediction.predicted_price)}
                <div className="result-bar" />
                <div className="result-disclaimer">
                  AI-estimated price based on model training data. Actual market prices may vary significantly.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>Powered by ML</span>
          <div className="footer-dot" />
          <span>FastAPI Backend</span>
          <div className="footer-dot" />
          <span>Indian Markets</span>
        </div>
      </div>
    </>
  );
}