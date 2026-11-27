import ReactMarkdown from 'react-markdown';
import { AlertTriangle, Scale, FileSearch } from 'lucide-react';
import { InferenceBadge } from './InferenceBadge';

interface ScanResultsProps {
  analysis: string | null;
  source: string | null;
  isLoading: boolean;
  error: string | null;
  onOpenNegotiate: () => void;
}

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

  return (
    <section className="card results-card">
      <div className="results-header">
        <h2 className="card-title">Risk & Clause Audit</h2>
        {source && <InferenceBadge source={source} />}
      </div>

      <div className="markdown-body">
        <ReactMarkdown>{analysis}</ReactMarkdown>
      </div>

      <div className="results-footer">
        <button type="button" className="btn-negotiate" onClick={onOpenNegotiate}>
          <Scale size={16} />
          Negotiate / Counter-Draft
        </button>
      </div>
    </section>
  );
}