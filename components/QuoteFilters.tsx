import React from 'react';
import { Quote } from '../types';

interface QuoteFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'created' | 'sold' | 'draft';
  setStatusFilter: (status: 'all' | 'created' | 'sold' | 'draft') => void;
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'year';
  setDateFilter: (period: 'all' | 'today' | 'week' | 'month' | 'year') => void;
  companyFilter: string;
  setCompanyFilter: (companyId: string) => void;
  quotes: Quote[];
  companies: Array<{ id: string; name: string }>;
}

const QuoteFilters: React.FC<QuoteFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  companyFilter,
  setCompanyFilter,
  quotes,
}) => {
  const statusCounts = {
    all: quotes.length,
    created: quotes.filter(q => q.status === 'created').length,
    sold: quotes.filter(q => q.status === 'sold').length,
    draft: quotes.filter(q => q.status === 'draft').length
  };

  const statusOptions = [
    { key: 'all' as const, label: 'Todas' },
    { key: 'created' as const, label: 'Activas' },
    { key: 'sold' as const, label: 'Vendidas' },
    { key: 'draft' as const, label: 'Borradores' },
  ];

  const dateOptions = [
    { key: 'all' as const, label: 'Siempre' },
    { key: 'today' as const, label: 'Hoy' },
    { key: 'week' as const, label: 'Semana' },
    { key: 'month' as const, label: 'Mes' },
    { key: 'year' as const, label: 'Año' },
  ];

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || companyFilter !== 'all';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por número, cliente o empresa..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Status pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500 mr-1">Estado</span>
          {statusOptions.map(({ key, label }) => {
            const isActive = statusFilter === key;
            const count = statusCounts[key];
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
                {key !== 'all' && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-indigo-700' : 'bg-gray-200/80'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-gray-200" />

        {/* Period pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500 mr-1">Período</span>
          {dateOptions.map(({ key, label }) => {
            const isActive = dateFilter === key;
            return (
              <button
                key={key}
                onClick={() => setDateFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <>
            <div className="hidden md:block w-px h-6 bg-gray-200" />
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
                setCompanyFilter('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpiar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QuoteFilters;
