import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50],
}) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = Math.min((currentPage - 1) * pageSize + 1, totalItems);
    const end = Math.min(currentPage * pageSize, totalItems);

    // Generate visible page numbers (max 5 around current)
    const getPageNumbers = (): (number | '...')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

        const pages: (number | '...')[] = [1];
        const left = Math.max(2, currentPage - 1);
        const right = Math.min(totalPages - 1, currentPage + 1);

        if (left > 2) pages.push('...');
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages - 1) pages.push('...');
        pages.push(totalPages);

        return pages;
    };

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2 text-sm">
            {/* Info + page size */}
            <div className="flex items-center gap-3 text-gray-500">
                <span>
                    Mostrando <strong className="text-gray-700">{start}–{end}</strong> de <strong className="text-gray-700">{totalItems}</strong>
                </span>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    aria-label="Resultados por página"
                >
                    {pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size} / pág</option>
                    ))}
                </select>
            </div>

            {/* Page buttons */}
            {totalPages > 1 && (
                <nav className="flex items-center gap-1" aria-label="Paginación">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Página anterior"
                    >
                        ←
                    </button>

                    {getPageNumbers().map((page, i) =>
                        page === '...' ? (
                            <span key={`dots-${i}`} className="px-2 text-gray-400">…</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`min-w-[32px] px-2 py-1 rounded-lg border text-xs font-medium transition-colors ${page === currentPage
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'border-gray-300 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300'
                                    }`}
                                aria-current={page === currentPage ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        )
                    )}

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Página siguiente"
                    >
                        →
                    </button>
                </nav>
            )}
        </div>
    );
};

export default Pagination;
