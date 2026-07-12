import { Link } from 'react-router-dom';
import { Ban } from 'lucide-react';

export default function InactivePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Ban className="mx-auto h-16 w-16 text-gray-400" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Link Inactive</h2>
        <p className="mt-2 text-sm text-gray-600">
          This link has been disabled or archived by its creator.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Go to LinkForge
          </Link>
        </div>
      </div>
    </div>
  );
}
