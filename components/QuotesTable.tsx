import React, { useState, useRef, useEffect } from 'react';
import { Quote } from '../types';
import { EditIcon, TrashIcon, CheckCircleIcon } from './icons/Icons';
import Pagination from './Pagination';

/** SVG icon for document/report button */
const DocumentIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

/** SVG icon for duplicate button */
const DuplicateIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

/** Email send icon */
const MailSendIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);

/** Three dots icon */
const MoreIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
    </svg>
);

interface QuotesTableProps {
    quotes: Quote[];
    paginatedQuotes: Quote[];
    totalItems: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onEdit: (quote: Quote) => void;
    onDuplicate: (quote: Quote) => void;
    onMarkSold: (quote: Quote) => void;
    onDelete: (quote: Quote) => void;
    onOpenReport: (quote: Quote) => void;
    onSendEmail: (quote: Quote) => void;
    deletingId: string | null;
    updatingStatusId: string | null;
    formatCurrency: (amount: number) => string;
}

const STATUS_CLASSES: Record<string, string> = {
    created: 'bg-blue-100 text-blue-800',
    draft: 'bg-amber-100 text-amber-900',
    sold: 'bg-green-100 text-green-800',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    created: 'Enviada',
    sold: 'Vendida',
};

/** Dropdown menu for secondary actions */
const ActionMenu: React.FC<{
    quote: Quote;
    onOpenReport: (q: Quote) => void;
    onSendEmail: (q: Quote) => void;
    onDuplicate: (q: Quote) => void;
    onMarkSold: (q: Quote) => void;
    onDelete: (q: Quote) => void;
    deletingId: string | null;
    updatingStatusId: string | null;
}> = ({ quote, onOpenReport, onSendEmail, onDuplicate, onMarkSold, onDelete, deletingId, updatingStatusId }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const items = [
        {
            label: 'Enviar por correo',
            icon: <MailSendIcon />,
            onClick: () => { onSendEmail(quote); setOpen(false); },
            color: 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
        },
        {
            label: 'Duplicar',
            icon: <DuplicateIcon />,
            onClick: () => { onDuplicate(quote); setOpen(false); },
            color: 'text-gray-700 hover:bg-purple-50 hover:text-purple-600',
        },
        ...(quote.status !== 'sold' ? [{
            label: updatingStatusId === quote.id ? 'Actualizando...' : 'Marcar Vendida',
            icon: <CheckCircleIcon className="w-4 h-4" />,
            onClick: () => { onMarkSold(quote); setOpen(false); },
            color: 'text-gray-700 hover:bg-green-50 hover:text-green-600',
            disabled: updatingStatusId === quote.id,
        }] : []),
        {
            label: deletingId === quote.id ? 'Eliminando...' : 'Eliminar',
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: () => { onDelete(quote); setOpen(false); },
            color: 'text-red-600 hover:bg-red-50',
            disabled: deletingId === quote.id,
        },
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`p-1.5 rounded-lg transition-colors ${open ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="Más acciones"
            >
                <MoreIcon />
            </button>
            {open && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30 animate-fade-in">
                    {items.map((item, i) => (
                        <button
                            key={i}
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${item.color} disabled:opacity-40`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const QuotesTable: React.FC<QuotesTableProps> = ({
    paginatedQuotes,
    totalItems,
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onDuplicate,
    onMarkSold,
    onDelete,
    onOpenReport,
    onSendEmail,
    deletingId,
    updatingStatusId,
    formatCurrency,
}) => {
    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Cotizaciones Recientes</h2>
            <div className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-md">
                {paginatedQuotes.length === 0 ? (
                    /* ── Empty state ── */
                    <div className="py-16 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-3 text-sm font-semibold text-gray-600">No se encontraron cotizaciones</h3>
                        <p className="mt-1 text-xs text-gray-400">Prueba ajustando los filtros o crea una nueva cotización.</p>
                    </div>
                ) : (
                    /* ── Table ── */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-300/50">
                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"># Cotización</th>
                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                                    <th className="p-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedQuotes.map(quote => (
                                    <tr key={quote.id} className="border-b border-gray-200/50 hover:bg-white/30 transition-colors group">
                                        <td className="p-3 text-sm font-medium text-gray-800">{quote.quoteNumber}</td>
                                        <td className="p-3 text-sm text-gray-600">{quote.clientCompany || quote.clientName}</td>
                                        <td className="p-3 text-sm text-gray-500">{new Date(quote.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-sm font-semibold text-gray-800 text-right">{formatCurrency(quote.total)}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_CLASSES[quote.status]}`}>
                                                {STATUS_LABELS[quote.status]}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Primary: Report */}
                                                <button
                                                    onClick={() => onOpenReport(quote)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                                                    title="Ver Reporte"
                                                >
                                                    <DocumentIcon className="h-3.5 w-3.5" />
                                                    Reporte
                                                </button>
                                                {/* Primary: Send Email */}
                                                <button
                                                    onClick={() => onSendEmail(quote)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                    title="Enviar por correo"
                                                >
                                                    <MailSendIcon className="h-3.5 w-3.5" />
                                                    Enviar
                                                </button>
                                                {/* Primary: Edit */}
                                                <button
                                                    onClick={() => onEdit(quote)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <EditIcon className="h-3.5 w-3.5" />
                                                    Editar
                                                </button>
                                                {/* Secondary: Dropdown */}
                                                <ActionMenu
                                                    quote={quote}
                                                    onOpenReport={onOpenReport}
                                                    onSendEmail={onSendEmail}
                                                    onDuplicate={onDuplicate}
                                                    onMarkSold={onMarkSold}
                                                    onDelete={onDelete}
                                                    deletingId={deletingId}
                                                    updatingStatusId={updatingStatusId}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {paginatedQuotes.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={onPageChange}
                        onPageSizeChange={onPageSizeChange}
                    />
                )}
            </div>
        </div>
    );
};

export default QuotesTable;
