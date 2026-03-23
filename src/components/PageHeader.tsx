import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // Action buttons
  breadcrumb?: string[];
}

/**
 * U4: Consistent page header with breadcrumbs and title.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children, breadcrumb }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center text-xs text-gray-400 dark:text-gray-500 mb-1" aria-label="Breadcrumb">
          <a href="/dashboard" className="hover:text-indigo-500 transition-colors">Inicio</a>
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center">
              <svg className="w-3 h-3 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={i === breadcrumb.length - 1 ? 'text-gray-600 dark:text-gray-300 font-medium' : ''}>
                {item}
              </span>
            </span>
          ))}
        </nav>
      )}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </div>
);

export default PageHeader;
