import { SearchX } from 'lucide-react';
import PublicErrorLayout from './PublicErrorLayout';

export default function NotFoundPage() {
  return (
    <PublicErrorLayout
      title="Link Not Found"
      description="The link you clicked does not exist or may have been deleted."
      icon={<SearchX className="h-10 w-10 text-gray-500" aria-hidden="true" />}
      iconBgColor="bg-gray-100 border-gray-200"
    />
  );
}
