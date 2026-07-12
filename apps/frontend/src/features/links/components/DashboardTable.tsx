import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Lock, Link2, ExternalLink, Archive, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import type { LinkItem } from '../api/useGetLinks';
import { EditLinkModal } from './EditLinkModal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useArchiveLink } from '../api/useArchiveLink';
import { useRestoreLink } from '../api/useRestoreLink';
import { useDeleteLink } from '../api/useDeleteLink';

interface DashboardTableProps {
  links: LinkItem[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: string;
  onSortChange: (column: string) => void;
}

export function DashboardTable({ links, isLoading, sortBy, sortOrder, onSortChange }: DashboardTableProps) {
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [archivingLink, setArchivingLink] = useState<LinkItem | null>(null);
  const [restoringLink, setRestoringLink] = useState<LinkItem | null>(null);
  const [deletingLink, setDeletingLink] = useState<LinkItem | null>(null);

  const archiveMutation = useArchiveLink(archivingLink?.id || '');
  const restoreMutation = useRestoreLink(restoringLink?.id || '');
  const deleteMutation = useDeleteLink(deletingLink?.id || '');

  const handleArchive = () => {
    archiveMutation.mutate(undefined, {
      onSuccess: () => setArchivingLink(null),
    });
  };

  const handleRestore = () => {
    restoreMutation.mutate(undefined, {
      onSuccess: () => setRestoringLink(null),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => setDeletingLink(null),
    });
  };

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
    <>
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
              <tr key={link.id} className={`hover:bg-gray-50 transition group ${link.status === 'ARCHIVED' ? 'opacity-75 bg-gray-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/links/${link.alias}`} className="flex items-center group-hover:text-blue-600 transition">
                    <span className={`font-medium text-gray-900 group-hover:text-blue-600 ${link.status === 'ARCHIVED' ? 'line-through text-gray-500' : ''}`}>{link.alias}</span>
                    {link.hasPassword && <Lock className="w-3 h-3 text-gray-400 ml-2" />}
                  </Link>
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
                    link.status === 'ARCHIVED' ? 'bg-gray-200 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {link.status.charAt(0) + link.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                  {format(new Date(link.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {link.status !== 'ARCHIVED' ? (
                    <>
                      <button 
                        onClick={() => setEditingLink(link)}
                        className="text-gray-400 hover:text-blue-600 mr-2 transition-colors"
                        title="Edit Link"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => setArchivingLink(link)}
                        className="text-gray-400 hover:text-orange-600 mr-2 transition-colors"
                        title="Archive Link"
                      >
                        <Archive className="w-4 h-4 inline" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setRestoringLink(link)}
                      className="text-gray-400 hover:text-green-600 mr-2 transition-colors"
                      title="Restore Link"
                    >
                      <RefreshCw className="w-4 h-4 inline" />
                    </button>
                  )}
                  <button 
                    onClick={() => setDeletingLink(link)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Link"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingLink && (
        <EditLinkModal 
          isOpen={true} 
          onClose={() => setEditingLink(null)} 
          link={editingLink} 
        />
      )}

      <ConfirmModal
        isOpen={!!archivingLink}
        onClose={() => setArchivingLink(null)}
        onConfirm={handleArchive}
        title="Archive Link"
        message={`Are you sure you want to archive /${archivingLink?.alias}? It will be hidden from the main dashboard but will continue to route traffic.`}
        confirmText="Archive"
        isLoading={archiveMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!restoringLink}
        onClose={() => setRestoringLink(null)}
        onConfirm={handleRestore}
        title="Restore Link"
        message={`Are you sure you want to restore /${restoringLink?.alias}? It will reappear on your main dashboard.`}
        confirmText="Restore"
        isLoading={restoreMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!deletingLink}
        onClose={() => setDeletingLink(null)}
        onConfirm={handleDelete}
        title="Delete Smart Link?"
        message={<>This action is irreversible. The link will immediately stop working, but historical aggregate analytics will be preserved.</>}
        confirmText="Delete Permanently"
        requireInputToConfirm={deletingLink?.alias}
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
