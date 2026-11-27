import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';
import { draftCounterProposal } from '../services/clauseGuardAI';
import { InferenceBadge } from './InferenceBadge';

interface NegotiateModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalClauseText: string;
  fallbackAnalysis: string;
}

const CONTRACT_TYPES = [
  'Residential lease',
  'Employment agreement',
  'SaaS / Terms of Service',
  'Freelance / Service contract',
  'Non-Disclosure Agreement (NDA)',
];

export function NegotiateModal({
  isOpen,
  onClose,
  originalClauseText,
  fallbackAnalysis,
}: NegotiateModalProps) {
  const [contractType, setContractType] = useState(CONTRACT_TYPES[0]);
  const [clauseInput, setClauseInput] = useState('');
  const [counterDraft, setCounterDraft] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClauseInput(originalClauseText.trim() || fallbackAnalysis);
      setCounterDraft(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, originalClauseText, fallbackAnalysis]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!clauseInput.trim()) return;
    if (!navigator.onLine) {
      setError('You are currently offline. Cloud counter-drafting requires an active internet connection.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const result = await draftCounterProposal(clauseInput, contractType);
      setCounterDraft(typeof result === 'string' ? result : String(result));
    } catch (err) {
  const raw = err instanceof Error ? err.message : '';
  if (raw.includes('429')) {
    setError('Daily free-tier AI quota reached. Please try again later or switch to a Lite model.');
  } else if (raw.includes('500') || raw.includes('503')) {
    setError('Gemini Cloud is temporarily busy. Please retry in a few seconds.');
  } else {
    setError(raw || 'Failed to generate counter-proposal from Gemini Cloud.');
  }
} finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!counterDraft) return;
    await navigator.clipboard.writeText(counterDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Negotiate & Counter-Draft</h3>
            <InferenceBadge source="in_cloud" />
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <label className="field-label" htmlFor="contract-type">
            Contract Context
          </label>
          <select
            id="contract-type"
            className="select-input"
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            disabled={isGenerating}
          >
            {CONTRACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="clause-to-redline">
            Clause / Findings to Redline
          </label>
          <textarea
            id="clause-to-redline"
            className="clause-textarea"
            rows={4}
            value={clauseInput}
            onChange={(e) => setClauseInput(e.target.value)}
            disabled={isGenerating}
          />

          <button
            type="button"
            className="btn-primary full-width"
            onClick={handleGenerate}
            disabled={isGenerating || !clauseInput.trim()}
          >
            <Sparkles size={16} />
            {isGenerating ? 'Drafting Balanced Redline...' : 'Generate Fair Counter-Proposal'}
          </button>

          {error && (
            <div className="inline-error-box">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {counterDraft && (
            <div className="draft-box">
              <div className="draft-box-header">
                <span>Proposed Redline</span>
                <button type="button" className="btn-secondary btn-sm" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
              <div className="markdown-body">
                <ReactMarkdown>{counterDraft}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}