import { ShieldCheck, Cloud } from 'lucide-react';

interface InferenceBadgeProps {
  source: 'on_device' | 'in_cloud' | string;
}

export function InferenceBadge({ source }: InferenceBadgeProps) {
  const isLocal = source === 'on_device';

  return (
    <span className={`inference-badge ${isLocal ? 'badge-local' : 'badge-cloud'}`}>
      {isLocal ? (
        <>
          <ShieldCheck size={15} />
          Processed Locally (Offline - Zero Data Sent)
        </>
      ) : (
        <>
          <Cloud size={15} />
          Processed in Cloud (Gemini)
        </>
      )}
    </span>
  );
}