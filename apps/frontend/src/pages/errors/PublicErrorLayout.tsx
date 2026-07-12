import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PublicErrorLayoutProps {
  icon: ReactNode;
  title: string;
  description: string;
  iconBgColor?: string;
}

export default function PublicErrorLayout({ 
  icon, 
  title, 
  description,
  iconBgColor = "bg-gray-100 border-gray-200"
}: PublicErrorLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 shadow-sm border ${iconBgColor}`}>
          {icon}
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
        <p className="mt-4 text-base text-gray-500">
          {description}
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />
            Return to LinkForge
          </Link>
        </div>
      </div>
      
      {/* Branding footer */}
      <div className="mt-12 text-center">
        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
          Powered by LinkForge
        </p>
      </div>
    </div>
  );
}
