import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetLink } from '../features/links/api/useGetLink';
import { LinkMetadataCard } from '../features/links/components/LinkMetadataCard';
import { LinkQuickStats } from '../features/links/components/LinkQuickStats';
import { QRCodeModal } from '../features/links/components/QRCodeModal';
import { ArrowLeft, Copy, QrCode, ExternalLink, Link2, AlertTriangle } from 'lucide-react';
import { FavoriteButton } from '../features/links/components/FavoriteButton';
import { RulesManager } from '../features/links/components/RulesManager';

export default function LinkDetailsPage() {
  const { alias } = useParams<{ alias: string }>();
  const navigate = useNavigate();
  const [isQRModalOpen, setQRModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, error } = useGetLink(alias || '');

  const handleCopy = () => {
    if (data?.data.shortUrl) {
      navigator.clipboard.writeText(data.data.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          {error?.message || "The smart link you're looking for doesn't exist or you don't have permission to view it."}
        </p>
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const link = data.data;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Navigation */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 break-all flex items-center">
              {link.alias}
              <div className="ml-2 mt-1">
                <FavoriteButton link={link} />
              </div>
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
              link.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
              link.status === 'EXPIRED' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {link.status}
            </span>
          </div>
          <div className="flex items-center text-blue-600 font-medium">
            <Link2 className="w-4 h-4 mr-1.5" />
            {link.shortUrl}
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setQRModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <QrCode className="w-4 h-4 mr-2 text-gray-500" />
            QR Code
          </button>
          
          <button 
            onClick={handleCopy}
            className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {copied ? (
              <span className="flex items-center">Copied!</span>
            ) : (
              <span className="flex items-center">
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LinkMetadataCard link={link} />
        </div>
        <div>
          <LinkQuickStats clicks={link.clicks} />
        </div>
      </div>
      
      {/* Smart Redirect Rules */}
      <RulesManager linkId={link.id} />

      <QRCodeModal 
        isOpen={isQRModalOpen}
        onClose={() => setQRModalOpen(false)}
        url={link.shortUrl}
        alias={link.alias}
      />
    </div>
  );
}
