import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * U5: Reusable empty state component for tables and lists.
 * Provides a call-to-action when no data is available.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8">
    {icon ? (
      <div className="mb-4 text-gray-300 dark:text-gray-600">{icon}</div>
    ) : (
      <div className="mb-4">
        <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">{title}</h3>
    <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 text-center max-w-sm">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
