import { useState, useEffect } from 'react';
import { ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { scanContractClause, type ClauseAnalysis } from './services/clauseGuardAI';
import { ClauseInput } from './components/ClauseInput';
import { ScanResults } from './components/ScanResults';
import { NegotiateModal } from './components/NegotiateModal';
import './index.css';

export function App() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ClauseAnalysis | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiateOpen, setIsNegotiateOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleScan = async () => {
    if (!text.trim() && !file) return;

    if (file?.type === 'application/pdf' && !navigator.onLine) {
      setError(
        'Offline Mode: Multi-page PDF documents require Gemini Cloud. Reconnect to the internet or scan a photo/text snippet locally.'
      );
      setAnalysis(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await scanContractClause({
        text: text.trim() || undefined,
        file: file || undefined,
      });
      setAnalysis(result.analysis);
      setSource(result.source);
    } catch (err) {
      setAnalysis(null);
      setSource(null);
      const raw = err instanceof Error ? err.message : '';
      if (raw.includes('429')) {
        setError('Daily free-tier AI quota reached. Please try again later.');
      } else if (raw.includes('500') || raw.includes('503')) {
        setError('Gemini Cloud is temporarily busy. Please retry in a few seconds.');
      } else {
        setError(
          raw || 'Unable to analyze this clause. Please verify your connection or Chrome Gemini Nano setup.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackAnalysisText = analysis
    ? `${analysis.summary}\n\n${analysis.redFlags
        .map((f) => `- [${f.severity}] ${f.title}: ${f.plainEnglish} ("${f.clauseQuote}")`)
        .join('\n')}`
    : '';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="brand-name">ClauseGuard</h1>
            <p className="brand-tagline">Hybrid AI Contract & ToS Scanner</p>
          </div>
        </div>

        <div className={`network-pill ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'Hybrid Ready' : 'Offline (Local Only)'}</span>
        </div>
      </header>

      <main className="main-container">
        <ClauseInput
          text={text}
          onTextChange={setText}
          file={file}
          onFileChange={setFile}
          onScan={handleScan}
          isLoading={isLoading}
          isOnline={isOnline}
        />

        <ScanResults
          analysis={analysis}
          source={source}
          isLoading={isLoading}
          error={error}
          onOpenNegotiate={() => setIsNegotiateOpen(true)}
        />
      </main>

      <NegotiateModal
        isOpen={isNegotiateOpen}
        onClose={() => setIsNegotiateOpen(false)}
        originalClauseText={text}
        fallbackAnalysis={fallbackAnalysisText}
      />
    </div>
  );
}

export default App;