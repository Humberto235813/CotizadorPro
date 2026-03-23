import React, { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Quote, QuoteItem, Company } from '../types';
import { UserIcon, CompanyIcon, EmailIcon, PhoneIcon, LocationIcon } from './icons/Icons';

/** Upward chevron icon */
const ChevronUpIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
);
/** Downward chevron icon */
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
);
/** Duplicate icon */
const DuplicateSmallIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);
/** Close icon */
const CloseModalIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);
/** Drag handle icon */
const DragHandleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" /></svg>
);
/** Delete row icon */
const DeleteRowIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);

interface QuoteEditModalProps {
    draft: Quote;
    companies: Company[];
    saving: boolean;
    errorMsg: string | null;
    onUpdateField: (field: keyof Quote, value: unknown) => void;
    onUpdateItem: (index: number, field: 'description' | 'quantity' | 'price' | 'discountType' | 'discountValue' | 'displayStyle', value: string) => void;
    onAddItem: () => void;
    onRemoveItem: (idx: number) => void;
    onDuplicateItem: (idx: number) => void;
    onMoveItem: (from: number, to: number) => void;
    onSave: () => void;
    onClose: () => void;
    onSetDraft: React.Dispatch<React.SetStateAction<Quote | null>>;
}

const QuoteEditModal: React.FC<QuoteEditModalProps> = ({
    draft,
    companies,
    saving,
    errorMsg,
    onUpdateField,
    onUpdateItem,
    onAddItem,
    onRemoveItem,
    onDuplicateItem,
    onMoveItem,
    onSave,
    onClose,
    onSetDraft,
}) => {
    // Drag & Drop
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [justMovedId, setJustMovedId] = useState<string | null>(null);

    const handleDragStart = (idx: number) => () => { setDragIndex(idx); };
    const handleDragOver = (idx: number) => (e: React.DragEvent) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === idx) return;
        onSetDraft(prev => {
            if (!prev) return prev;
            const items = [...prev.items];
            const [moved] = items.splice(dragIndex, 1);
            items.splice(idx, 0, moved);
            setDragIndex(idx);
            setJustMovedId(moved.internalId ?? null);
            return { ...prev, items };
        });
    };
    const handleDragEnd = () => { setDragIndex(null); setTimeout(() => setJustMovedId(null), 400); };

    // Compute totals
    const computeTotals = (d: Quote) => {
        const subtotal = d.items.reduce((acc, it) => {
            const lineBase = (it.quantity * it.price) || 0;
            let discount = 0;
            if (it.discountType === 'percent' && it.discountValue) discount = lineBase * (it.discountValue / 100);
            else if (it.discountType === 'amount' && it.discountValue) discount = it.discountValue;
            return acc + Math.max(0, lineBase - discount);
        }, 0);
        const company = companies.find(c => c.id === d.companyId);
        const companyTaxRate = company?.taxRate ?? 0.16;
        const taxRate = d.subtotal > 0 ? (d.tax / d.subtotal) : companyTaxRate;
        const tax = +(subtotal * taxRate).toFixed(2);
        const total = +(subtotal + tax).toFixed(2);
        return { subtotal, tax, total };
    };

    const liveTotals = useMemo(() => computeTotals(draft), [draft]);

    const [displayTotals, setDisplayTotals] = useState(liveTotals);
    const [flashTotals, setFlashTotals] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDisplayTotals(liveTotals);
            setFlashTotals(true);
            const clear = setTimeout(() => setFlashTotals(false), 400);
            return () => clearTimeout(clear);
        }, 300);
        return () => clearTimeout(handler);
    }, [liveTotals.subtotal, liveTotals.tax, liveTotals.total]);

    return (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-transparent" aria-labelledby="editQuoteTitle">
            <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar modal" />
            <div className="relative w-[95vw] max-w-[1400px] max-h-[95vh] mx-4 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                    <h3 id="editQuoteTitle" className="text-lg md:text-xl font-semibold text-gray-800">
                        {draft.id ? 'Editar' : 'Nueva'} Cotización {draft.quoteNumber}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1" aria-label="Cerrar">
                        <CloseModalIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
                    {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{errorMsg}</div>}

                    {/* Client Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <FieldWithIcon label="Cliente (Persona)" htmlFor="clientName" icon={<UserIcon className="w-4 h-4" />}>
                            <input id="clientName" value={draft.clientName} onChange={e => onUpdateField('clientName', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all" placeholder="Ej: Juan Pérez" />
                        </FieldWithIcon>
                        <FieldWithIcon label="Empresa del Cliente" htmlFor="clientCompany" icon={<CompanyIcon className="w-4 h-4" />}>
                            <input id="clientCompany" value={draft.clientCompany} onChange={e => onUpdateField('clientCompany', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all" placeholder="Ej: Acme Corporation" />
                        </FieldWithIcon>
                        <FieldWithIcon label="Email" htmlFor="clientEmail" icon={<EmailIcon className="w-4 h-4" />}>
                            <input id="clientEmail" type="email" value={draft.clientEmail} onChange={e => onUpdateField('clientEmail', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all" placeholder="Ej: contacto@empresa.com" />
                        </FieldWithIcon>
                        <FieldWithIcon label="Teléfono" htmlFor="clientPhone" icon={<PhoneIcon className="w-4 h-4" />}>
                            <input id="clientPhone" value={draft.clientPhone} onChange={e => onUpdateField('clientPhone', e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all" placeholder="Ej: 55 1234 5678" />
                        </FieldWithIcon>
                        <div className="md:col-span-2">
                            <label htmlFor="clientAddress" className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 text-gray-400 pointer-events-none"><LocationIcon className="w-4 h-4" /></div>
                                <textarea id="clientAddress" value={draft.clientAddress} onChange={e => onUpdateField('clientAddress', e.target.value)} rows={2} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-y transition-all" placeholder="Ej: Av. Reforma 123, CDMX" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="quoteStatus" className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                            <select id="quoteStatus" value={draft.status} onChange={e => onUpdateField('status', e.target.value as Quote['status'])} className="w-full border rounded px-3 py-2">
                                <option value="draft">Borrador</option>
                                <option value="created">Enviada</option>
                                <option value="sold">Vendida</option>
                            </select>
                        </div>

                        {/* Totals Summary */}
                        <div className="md:col-span-2 grid sm:grid-cols-3 gap-4 bg-gray-50 border rounded p-3 text-xs">
                            <div><span className="block text-gray-500">Subtotal</span><span className={`font-semibold transition-colors duration-300 ${flashTotals ? 'bg-yellow-100 px-1 rounded' : ''}`}>{displayTotals?.subtotal.toFixed(2) ?? '0.00'}</span></div>
                            <div><span className="block text-gray-500">Impuesto</span><span className={`font-semibold transition-colors duration-300 ${flashTotals ? 'bg-yellow-100 px-1 rounded' : ''}`}>{displayTotals?.tax.toFixed(2) ?? '0.00'}</span></div>
                            <div><span className="block text-gray-500">Total</span><span className={`font-semibold text-indigo-600 transition-colors duration-300 ${flashTotals ? 'bg-indigo-50 px-1 rounded' : ''}`}>{displayTotals?.total.toFixed(2) ?? '0.00'}</span></div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-700">Conceptos</h4>
                            <button type="button" onClick={onAddItem} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Añadir</button>
                        </div>
                        <div className="overflow-x-auto border rounded">
                            <table className="min-w-full text-xs md:text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-left w-1/2">Descripción</th>
                                        <th className="p-2 text-left w-20">Cant.</th>
                                        <th className="p-2 text-left w-28">Precio</th>
                                        <th className="p-2 text-right w-28">Importe</th>
                                        <th className="p-2 w-8"><span className="sr-only">Eliminar</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draft.items.map((it, idx) => {
                                        const base = (it.quantity * it.price) || 0;
                                        let discount = 0;
                                        if (it.discountType === 'percent') discount = base * ((it.discountValue || 0) / 100);
                                        else if (it.discountType === 'amount') discount = (it.discountValue || 0);
                                        const lineTotal = Math.max(0, base - discount);
                                        return (
                                            <tr
                                                key={it.internalId}
                                                className={`border-t transition-colors ${dragIndex === idx ? 'bg-indigo-50/40' : ''} ${justMovedId === it.internalId ? 'animate-pulse' : 'hover:bg-gray-50'}`}
                                                draggable
                                                onDragStart={handleDragStart(idx)}
                                                onDragOver={handleDragOver(idx)}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <td className="p-2 space-y-1">
                                                    <div className="flex items-center gap-2 -mt-1">
                                                        <span className="cursor-grab active:cursor-grabbing text-gray-400" title="Arrastrar para reordenar"><DragHandleIcon className="w-4 h-4" /></span>
                                                        <span className="text-[10px] text-gray-400">#{idx + 1}</span>
                                                        <div className="flex items-center gap-1 ml-auto">
                                                            <button type="button" onClick={() => onMoveItem(idx, idx - 1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30" aria-label="Mover arriba"><ChevronUpIcon /></button>
                                                            <button type="button" onClick={() => onMoveItem(idx, idx + 1)} disabled={idx === draft.items.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30" aria-label="Mover abajo"><ChevronDownIcon /></button>
                                                            <button type="button" onClick={() => onDuplicateItem(idx)} className="text-purple-500 hover:text-purple-700" aria-label="Duplicar concepto"><DuplicateSmallIcon /></button>
                                                        </div>
                                                    </div>
                                                    <div className="border rounded-lg overflow-hidden">
                                                        {/* Formatting Toolbar */}
                                                        <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-50 border-b">
                                                            {[
                                                                { label: 'Negrita', icon: <span className="font-bold text-xs">B</span>, wrap: ['**', '**'], title: 'Negrita (Ctrl+B)' },
                                                                { label: 'Cursiva', icon: <span className="italic text-xs">I</span>, wrap: ['*', '*'], title: 'Cursiva (Ctrl+I)' },
                                                                { label: 'Subrayado', icon: <span className="underline text-xs">U</span>, wrap: ['__', '__'], title: 'Subrayado' },
                                                            ].map((btn) => (
                                                                <button
                                                                    key={btn.label}
                                                                    type="button"
                                                                    title={btn.title}
                                                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors text-gray-600"
                                                                    onClick={() => {
                                                                        const ta = document.getElementById(`desc-${it.internalId}`) as HTMLTextAreaElement;
                                                                        if (!ta) return;
                                                                        const start = ta.selectionStart;
                                                                        const end = ta.selectionEnd;
                                                                        const text = ta.value;
                                                                        const selected = text.substring(start, end);
                                                                        const replacement = selected
                                                                            ? `${btn.wrap[0]}${selected}${btn.wrap[1]}`
                                                                            : `${btn.wrap[0]}texto${btn.wrap[1]}`;
                                                                        const newValue = text.substring(0, start) + replacement + text.substring(end);
                                                                        onUpdateItem(idx, 'description', newValue);
                                                                        setTimeout(() => {
                                                                            ta.focus();
                                                                            const cursorPos = selected
                                                                                ? start + replacement.length
                                                                                : start + btn.wrap[0].length;
                                                                            ta.setSelectionRange(cursorPos, selected ? cursorPos : cursorPos + 5);
                                                                        }, 10);
                                                                    }}
                                                                >{btn.icon}</button>
                                                            ))}
                                                            <div className="w-px h-5 bg-gray-300 mx-1" />
                                                            <button
                                                                type="button"
                                                                title="Lista con viñetas"
                                                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors text-gray-600"
                                                                onClick={() => {
                                                                    const ta = document.getElementById(`desc-${it.internalId}`) as HTMLTextAreaElement;
                                                                    if (!ta) return;
                                                                    const start = ta.selectionStart;
                                                                    const text = ta.value;
                                                                    const before = text.substring(0, start);
                                                                    const needsNewline = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
                                                                    const newValue = before + needsNewline + '- ' + text.substring(start);
                                                                    onUpdateItem(idx, 'description', newValue);
                                                                    setTimeout(() => { ta.focus(); const pos = before.length + needsNewline.length + 2; ta.setSelectionRange(pos, pos); }, 10);
                                                                }}
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /><circle cx="2" cy="6" r="1" fill="currentColor" /><circle cx="2" cy="12" r="1" fill="currentColor" /><circle cx="2" cy="18" r="1" fill="currentColor" /></svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Línea separadora"
                                                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors text-gray-600"
                                                                onClick={() => {
                                                                    const ta = document.getElementById(`desc-${it.internalId}`) as HTMLTextAreaElement;
                                                                    if (!ta) return;
                                                                    const start = ta.selectionStart;
                                                                    const text = ta.value;
                                                                    const before = text.substring(0, start);
                                                                    const needsNewline = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
                                                                    const newValue = before + needsNewline + '---\n' + text.substring(start);
                                                                    onUpdateItem(idx, 'description', newValue);
                                                                    setTimeout(() => { ta.focus(); const pos = before.length + needsNewline.length + 4; ta.setSelectionRange(pos, pos); }, 10);
                                                                }}
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" /></svg>
                                                            </button>
                                                        </div>
                                                        {/* Textarea */}
                                                        <textarea id={`desc-${it.internalId}`} value={it.description} onChange={e => onUpdateItem(idx, 'description', e.target.value)} rows={4} className="w-full px-2 py-1.5 resize-y text-sm leading-snug border-0 focus:ring-0 focus:outline-none" placeholder="Escribe la descripción del concepto..." />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 items-center text-[11px]">
                                                        <select value={it.displayStyle || 'normal'} onChange={e => onUpdateItem(idx, 'displayStyle', e.target.value)} className="border rounded px-1 py-0.5 text-[11px]">
                                                            <option value="normal">Normal</option>
                                                            <option value="highlight">Destacado</option>
                                                            <option value="small">Pequeño</option>
                                                        </select>
                                                        <span className="text-gray-500">{(it.description || '').length} chars</span>
                                                        <span className="text-gray-500">Base: {base.toFixed(2)} {discount > 0 && <span className="text-red-500">(-{discount.toFixed(2)})</span>}</span>
                                                        <button type="button" onClick={() => {
                                                            const el = document.getElementById('md-preview-' + it.internalId);
                                                            if (el) el.classList.toggle('hidden');
                                                        }} className="text-indigo-600 hover:underline">Preview</button>
                                                    </div>
                                                    <div id={`md-preview-${it.internalId}`} className="hidden border rounded bg-gray-50 p-2 text-xs leading-relaxed prose prose-sm max-w-none">
                                                        {(it.description || '').split(/\n/).map((l, li) => {
                                                            const bold = l.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|\s)\*(?!\s)([^*]+?)\*(?=\s|$)/g, '$1<em>$2</em>');
                                                            const keyBase = it.internalId + '-' + li;
                                                            if (/^[-*]\s+/.test(l)) return <div key={keyBase} className="ml-4 list-disc">• <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bold.replace(/^[-*]\s+/, '')) }} /></div>;
                                                            if (!l.trim()) return <br key={keyBase} />;
                                                            return <div key={keyBase} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bold) }} />;
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="p-2"><input type="number" min={0} value={it.quantity} onChange={e => onUpdateItem(idx, 'quantity', e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                                                <td className="p-2"><input type="number" min={0} step="0.01" value={it.price} onChange={e => onUpdateItem(idx, 'price', e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                                                <td className="p-2 text-right font-medium">{lineTotal.toFixed(2)}
                                                    <div className="mt-1 flex items-center gap-1 justify-end">
                                                        <select value={it.discountType || 'percent'} onChange={e => onUpdateItem(idx, 'discountType', e.target.value)} className="border rounded px-1 py-0.5 text-[11px]">
                                                            <option value="percent">% desc</option>
                                                            <option value="amount">$ desc</option>
                                                        </select>
                                                        <input type="number" min={0} step="0.01" value={it.discountValue || 0} onChange={e => onUpdateItem(idx, 'discountValue', e.target.value)} className="w-16 border rounded px-1 py-0.5 text-[11px]" />
                                                    </div>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button type="button" onClick={() => onRemoveItem(idx)} className="text-red-500 hover:text-red-700 p-1" aria-label="Eliminar"><DeleteRowIcon /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {draft.items.length === 0 && (
                                        <tr><td colSpan={5} className="p-4 text-center text-gray-500 text-xs">Sin renglones</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes & Conditions */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="notes" className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                            <textarea id="notes" value={draft.notes || ''} onChange={e => onUpdateField('notes', e.target.value)} rows={3} className="w-full border rounded px-3 py-2 resize-y" />
                        </div>
                        <div>
                            <label htmlFor="serviceConditions" className="block text-xs font-medium text-gray-600 mb-1">Condiciones de Servicio</label>
                            <textarea id="serviceConditions" value={draft.serviceConditions || ''} onChange={e => onUpdateField('serviceConditions', e.target.value)} rows={3} className="w-full border rounded px-3 py-2 resize-y" />
                        </div>
                    </div>

                    {/* Vigencia */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Vigencia de la Cotización</label>
                        <div className="flex flex-wrap gap-2">
                            {([15, 20, 30, 60, 90] as const).map(dias => (
                                <button
                                    key={dias}
                                    type="button"
                                    onClick={() => onUpdateField('vigenciaDias', dias)}
                                    className={`py-2 px-4 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${(draft.vigenciaDias || 30) === dias
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                                        }`}
                                >
                                    {dias} días
                                </button>
                            ))}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">o</span>
                                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
                                    <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        placeholder="Otro"
                                        value={![15, 20, 30, 60, 90].includes(draft.vigenciaDias || 30) ? (draft.vigenciaDias || '') : ''}
                                        onChange={e => {
                                            const v = parseInt(e.target.value, 10);
                                            if (v > 0) onUpdateField('vigenciaDias', v);
                                        }}
                                        className="w-16 py-2 px-2 text-sm text-center border-0 focus:ring-0 focus:outline-none"
                                    />
                                    <span className="text-xs text-gray-400 pr-3">días</span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-1.5 text-xs text-gray-400">
                            La cotización será válida por {draft.vigenciaDias || 30} días a partir de la fecha de emisión.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-white disabled:opacity-50">Cancelar</button>
                    <button onClick={onSave} disabled={saving} className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                        {saving && <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
                        Guardar
                    </button>
                </div>
            </div>
        </dialog>
    );
};

/** Helper component for form fields with icon prefix */
const FieldWithIcon: React.FC<{ label: string; htmlFor: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, htmlFor, icon, children }) => (
    <div>
        <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>
            {children}
        </div>
    </div>
);

export default QuoteEditModal;
