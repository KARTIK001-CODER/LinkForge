import { Ban } from 'lucide-react';
import PublicErrorLayout from './PublicErrorLayout';

export default function InactivePage() {
  return (
    <PublicErrorLayout
      title="Link Inactive"
      description="This link is not currently active. It may have been disabled, archived, or is scheduled to activate at a later time."
      icon={<Ban className="h-10 w-10 text-gray-500" aria-hidden="true" />}
      iconBgColor="bg-gray-100 border-gray-200"
    />
  );
}
