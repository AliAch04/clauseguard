import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  Upload,
  Camera,
  FileText,
  Image as ImageIcon,
  X,
  Shield,
  Cloud,
  ScanSearch,
  Sparkles,
} from 'lucide-react';

interface ClauseInputProps {
  text: string;
  onTextChange: (value: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onScan: () => void;
  isLoading: boolean;
  isOnline: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const SAMPLE_CLAUSE =
  'The Tenant hereby waives all rights to statutory notice prior to eviction and agrees that the Landlord may enter the premises at any time without prior consent, retaining 100% of the security deposit regardless of property condition.';

export function ClauseInput({
  text,
  onTextChange,
  file,
  onFileChange,
  onScan,
  isLoading,
  isOnline,
}: ClauseInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isPdf = file?.type === 'application/pdf';
  const canSubmit = !isLoading && (text.trim().length > 0 || file !== null);

  const validateAndSetFile = (selected: File | undefined) => {
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError('Unsupported format. Please select a JPEG, PNG, or PDF file.');
      return;
    }
    setFileError(null);
    onFileChange(selected);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Contract Clause Input</h2>
          <p className="card-subtitle">
            Paste a legal clause, snap a photo, or upload a contract document.
          </p>
        </div>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => onTextChange(SAMPLE_CLAUSE)}
          disabled={isLoading}
        >
          <Sparkles size={14} />
          Try Sample Clause
        </button>
      </div>

      {/* Zone de saisie texte */}
      <textarea
        className="clause-textarea"
        rows={5}
        placeholder="Paste suspicious contract or Terms of Service text here..."
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={isLoading}
      />

      {/* Zone de dépôt / sélection fichier */}
      <div
        className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden-input"
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          className="hidden-input"
          onChange={handleFileSelect}
        />

        {file ? (
          <div className="file-chip">
            <div className="file-chip-info">
              {isPdf ? <FileText size={18} className="icon-cloud" /> : <ImageIcon size={18} className="icon-local" />}
              <div>
                <p className="file-name">{file.name}</p>
                <p className="file-meta">
                  {(file.size / 1024).toFixed(1)} KB • {isPdf ? 'PDF Document' : 'Image Scan'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={() => onFileChange(null)}
              disabled={isLoading}
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="dropzone-content">
            <p className="dropzone-text">Drag & drop a file here, or choose an option:</p>
            <div className="dropzone-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload size={15} />
                Upload JPEG / PNG / PDF
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
              >
                <Camera size={15} />
                Take Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {fileError && <p className="inline-error">{fileError}</p>}

      {/* Barre inférieure : Indicateur de routage + Bouton d'analyse */}
      <div className="card-footer">
        <div className={`route-indicator ${isPdf ? 'route-cloud' : 'route-local'}`}>
          {isPdf ? (
            <>
              <Cloud size={15} />
              <span>
                PDF Cloud Analysis {!isOnline && '(Requires Internet Connection)'}
              </span>
            </>
          ) : (
            <>
              <Shield size={15} />
              <span>Image/Text Local Private Scan</span>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={onScan}
          disabled={!canSubmit}
        >
          <ScanSearch size={16} />
          {isLoading ? 'Scanning Clause...' : 'Scan Clause'}
        </button>
      </div>
    </section>
  );
}