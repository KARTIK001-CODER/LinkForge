import { format } from 'date-fns';
import { ExternalLink, Lock, Globe, Clock, Tag } from 'lucide-react';
import type { LinkItem } from '../api/useGetLinks';

interface LinkMetadataCardProps {
  link: LinkItem & { updatedAt?: string };
}

export function LinkMetadataCard({ link }: LinkMetadataCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-semibold text-gray-900">Link Configuration</h3>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
            <ExternalLink className="w-4 h-4 mr-2" />
            Destination URL
          </h4>
          <a 
            href={link.destinationUrl}
            target="_blank"
            rel="noreferrer"
            className="text-gray-900 break-all hover:text-blue-600 transition"
          >
            {link.destinationUrl}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              {link.hasPassword ? <Lock className="w-4 h-4 mr-2 text-amber-500" /> : <Globe className="w-4 h-4 mr-2 text-green-500" />}
              Security
            </h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              link.hasPassword ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
            }`}>
              {link.hasPassword ? 'Password Protected' : 'Public'}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              Expiration
            </h4>
            <span className="text-gray-900 text-sm">
              {link.expiresAt ? format(new Date(link.expiresAt), 'MMM d, yyyy, h:mm a') : 'Never'}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
            <Tag className="w-4 h-4 mr-2 text-gray-400" />
            Tags
          </h4>
          {link.tags && link.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {link.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">No tags applied</span>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <span className="block font-medium mb-1">Created</span>
            {format(new Date(link.createdAt), 'MMM d, yyyy')}
          </div>
          {link.updatedAt && (
            <div>
              <span className="block font-medium mb-1">Last Updated</span>
              {format(new Date(link.updatedAt), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
