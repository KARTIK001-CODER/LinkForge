import { Link } from 'react-router-dom';
import { Ban, ArrowLeft } from 'lucide-react';

export default function InactivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-200">
          <Ban className="h-10 w-10 text-gray-500" />
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">Link Inactive</h2>
        <p className="mt-4 text-base text-gray-500">
          This link is not currently active. It may have been disabled, archived, or is scheduled to activate at a later time.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Return to LinkForge
          </Link>
        </div>
      </div>
    </div>
  );
}
