import React from 'react';

interface SkeletonLoaderProps {
  rows?: number;
  type?: 'table' | 'card' | 'stat';
}

/**
 * U3: Reusable skeleton loader for all pages.
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ rows = 5, type = 'table' }) => {
  if (type === 'stat') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-3">
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 dark:bg-gray-800 p-3 flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          ))}
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-3 border-t border-gray-100 dark:border-gray-700/50 flex gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
