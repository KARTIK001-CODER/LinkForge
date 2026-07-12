import { AlertTriangle } from 'lucide-react';
import PublicErrorLayout from './PublicErrorLayout';

export default function ServerErrorPage() {
  return (
    <PublicErrorLayout
      title="Temporary Service Disruption"
      description="We're experiencing a temporary issue trying to route this link. Please try again in a few moments."
      icon={<AlertTriangle className="h-10 w-10 text-orange-500" aria-hidden="true" />}
      iconBgColor="bg-orange-50 border-orange-100"
    />
  );
}
