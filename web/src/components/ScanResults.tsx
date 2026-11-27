import ReactMarkdown from 'react-markdown';
import { AlertTriangle, Scale, FileSearch, Quote } from 'lucide-react';
import { InferenceBadge } from './InferenceBadge';
import type { ClauseAnalysis, RiskSeverity } from '../services/clauseGuardAI';

interface ScanResultsProps {
  analysis: ClauseAnalysis | null;
  source: string | null;
  isLoading: boolean;
  error: string | null;
  onOpenNegotiate: () => void;
}

const RISK_LABELS: Record<RiskSeverity, string> = {
  HIGH: 'High Risk',
  MEDIUM: 'Medium Risk',
  LOW: 'Low Risk',
};

export function ScanResults({
  analysis,
  source,
  isLoading,
  error,
  onOpenNegotiate,
}: ScanResultsProps) {
  if (isLoading) {
    return (
      <section className="card" aria-busy="true">
        <div className="skeleton skeleton-badge" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="card error-card" role="alert">
        <div className="error-header">
          <AlertTriangle size={20} />
          <h3>Scan Interrupted</h3>
        </div>
        <p>{error}</p>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="card empty-card">
        <FileSearch size={28} className="empty-icon" />
        <p className="empty-title">Ready to Audit Clauses</p>
        <p className="empty-subtitle">
          Text and images are scanned privately on your device. Multi-page PDFs escalate to Gemini Cloud.
        </p>
      </section>
    );
  }

  const overallRisk = analysis.overallRisk || 'MEDIUM';

  return (
    <section className="card results-card">
      <div className="results-header">
        <div className="results-title-group">
          <h2 className="card-title">Risk & Clause Audit</h2>
          <span className={`risk-pill risk-${overallRisk.toLowerCase()}`}>
            {RISK_LABELS[overallRisk]}
          </span>
        </div>
        {source && <InferenceBadge source={source} />}
      </div>

      <div className="summary-box markdown-body">
        <ReactMarkdown>{analysis.summary}</ReactMarkdown>
      </div>

      {analysis.redFlags && analysis.redFlags.length > 0 && (
        <div className="redflags-list">
          {analysis.redFlags.map((flag, idx) => {
            const sev = flag.severity || 'MEDIUM';
            return (
              <article key={idx} className={`redflag-card border-${sev.toLowerCase()}`}>
                <div className="redflag-header">
                  <h3 className="redflag-title">{flag.title}</h3>
                  <span className={`risk-pill risk-${sev.toLowerCase()}`}>
                    {sev}
                  </span>
                </div>

                {flag.clauseQuote && (
                  <blockquote className="clause-quote">
                    <Quote size={13} />
                    <span>{flag.clauseQuote}</span>
                  </blockquote>
                )}

                <p className="redflag-explanation">{flag.plainEnglish}</p>
              </article>
            );
          })}
        </div>
      )}

      <div className="results-footer">
        <button type="button" className="btn-negotiate" onClick={onOpenNegotiate}>
          <Scale size={16} />
          Negotiate / Counter-Draft
        </button>
      </div>
    </section>
  );
}