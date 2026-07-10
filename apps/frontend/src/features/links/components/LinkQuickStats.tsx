import { MousePointerClick } from 'lucide-react';

interface LinkQuickStatsProps {
  clicks: number;
}

export function LinkQuickStats({ clicks }: LinkQuickStatsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
      </div>
      <div className="p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Lifetime Clicks</p>
            <p className="text-3xl font-bold text-gray-900">{clicks.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Detailed timeseries analytics will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
