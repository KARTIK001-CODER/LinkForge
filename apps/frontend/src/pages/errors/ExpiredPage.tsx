import { Clock } from 'lucide-react';
import PublicErrorLayout from './PublicErrorLayout';

export default function ExpiredPage() {
  return (
    <PublicErrorLayout
      title="Link Expired"
      description="This link has passed its expiration date and is no longer accessible. The campaign or offer may have ended."
      icon={<Clock className="h-10 w-10 text-red-500" aria-hidden="true" />}
      iconBgColor="bg-red-50 border-red-100"
    />
  );
}
