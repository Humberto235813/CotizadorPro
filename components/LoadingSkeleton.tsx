import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'table' | 'card' | 'stats';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant = 'table', count = 3 }) => {
  if (variant === 'stats') {
    return (
      <div className="mb-6">
        <div className="mb-4">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-1.5 bg-gray-300 animate-pulse"></div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="text-right flex-1 ml-4">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 ml-auto animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-32 ml-auto animate-pulse"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table variant (default)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(6)].map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[...Array(count)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                {[...Array(6)].map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className={`h-4 bg-gray-200 rounded animate-pulse ${colIndex === 0 ? 'w-20' : colIndex === 5 ? 'w-24' : 'w-full'}`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
