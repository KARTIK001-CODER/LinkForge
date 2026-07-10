import { format } from 'date-fns';
import { Lock, Link2, ExternalLink, MoreVertical } from 'lucide-react';
import type { LinkItem } from '../api/useGetLinks';

interface DashboardTableProps {
  links: LinkItem[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: string;
  onSortChange: (column: string) => void;
}

export function DashboardTable({ links, isLoading, sortBy, sortOrder, onSortChange }: DashboardTableProps) {
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="animate-pulse flex space-x-4 p-6">
          <div className="flex-1 space-y-6 py-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Link2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No links found</h3>
        <p className="text-gray-500 mt-1">Try adjusting your filters or create a new smart link.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSortChange('alias')}
            >
              Alias <SortIcon column="alias" />
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
              Destination URL
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
              Tags
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden sm:table-cell"
              onClick={() => onSortChange('createdAt')}
            >
              Created <SortIcon column="createdAt" />
            </th>
            <th scope="col" className="relative px-6 py-4">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {links.map((link) => (
            <tr key={link.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{link.alias}</span>
                  {link.hasPassword && <Lock className="w-3 h-3 text-gray-400 ml-2" />}
                </div>
                <div className="text-sm text-gray-500 block md:hidden truncate max-w-[150px] mt-1">
                  {link.destinationUrl}
                </div>
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                <a 
                  href={link.destinationUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center max-w-[300px] truncate"
                  title={link.destinationUrl}
                >
                  <span className="truncate">{link.destinationUrl}</span>
                  <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                </a>
              </td>
              <td className="px-6 py-4 hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {link.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                  {link.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                      +{link.tags.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  link.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                  link.status === 'EXPIRED' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {link.status.charAt(0) + link.status.slice(1).toLowerCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                {format(new Date(link.createdAt), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
