import React, { useState, useMemo } from 'react';
import { Deal, DealStage, DEAL_STAGE_LABELS, DEAL_STAGE_ORDER } from '../types';
import { PlusIcon, TrashIcon, EditIcon, CancelIcon, NoteIcon, CalendarIcon } from '../components/icons/Icons';
import { toast } from 'react-hot-toast';
import { useData } from '../src/contexts/DataContext';
import { useConfirmModal } from '../src/hooks/useConfirmModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency } from '../src/utils/format';

const STAGE_COLORS: Record<DealStage, { bg: string; border: string; header: string; badge: string }> = {
    prospect: { bg: 'bg-slate-50', border: 'border-slate-200', header: 'bg-slate-100 text-slate-700', badge: 'bg-slate-200 text-slate-700' },
    contacted: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100 text-blue-700', badge: 'bg-blue-200 text-blue-700' },
    quoted: { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-100 text-indigo-700', badge: 'bg-indigo-200 text-indigo-700' },
    negotiation: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100 text-amber-700', badge: 'bg-amber-200 text-amber-700' },
    closed_won: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100 text-green-700', badge: 'bg-green-200 text-green-700' },
    closed_lost: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100 text-red-700', badge: 'bg-red-200 text-red-700' },
};

const emptyDeal = (): Omit<Deal, 'id' | 'createdAt' | 'updatedAt'> => ({
    contactId: '', companyId: '', title: '', value: 0, stage: 'prospect', probability: 20, expectedCloseDate: '', quoteIds: [], notes: '',
});

const PipelinePage: React.FC = () => {
    const { deals, contacts, companies, quotes, addDeal: onAddDeal, updateDeal: onUpdateDeal, deleteDeal: onDeleteDeal } = useData();
    const { confirmState, confirm, closeConfirm } = useConfirmModal();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyDeal());
    const [saving, setSaving] = useState(false);
    const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

    const fmtMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

    const dealsByStage = useMemo(() => {
        const map: Record<DealStage, Deal[]> = {
            prospect: [], contacted: [], quoted: [], negotiation: [], closed_won: [], closed_lost: [],
        };
        deals.forEach(d => { if (map[d.stage]) map[d.stage].push(d); });
        return map;
    }, [deals]);

    // Pipeline summary
    const summary = useMemo(() => {
        const active = deals.filter(d => !d.stage.startsWith('closed'));
        const totalValue = active.reduce((a, d) => a + d.value, 0);
        const weightedValue = active.reduce((a, d) => a + d.value * (d.probability / 100), 0);
        const won = deals.filter(d => d.stage === 'closed_won');
        const wonValue = won.reduce((a, d) => a + d.value, 0);
        return { activeCount: active.length, totalValue, weightedValue, wonCount: won.length, wonValue };
    }, [deals]);

    const contactName = (id: string) => contacts.find(c => c.id === id)?.name || 'Sin contacto';
    const companyName = (id: string) => companies.find(c => c.id === id)?.name || '';

    const openNew = (stage: DealStage = 'prospect') => { setForm({ ...emptyDeal(), stage }); setEditingId(null); setShowModal(true); };
    const openEdit = (d: Deal) => {
        setForm({ contactId: d.contactId, companyId: d.companyId, title: d.title, value: d.value, stage: d.stage, probability: d.probability, expectedCloseDate: d.expectedCloseDate, quoteIds: d.quoteIds || [], notes: d.notes || '' });
        setEditingId(d.id);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('El título es requerido'); return; }
        setSaving(true);
        try {
            if (editingId) { await onUpdateDeal(editingId, form); toast.success('Deal actualizado'); }
            else { await onAddDeal(form); toast.success('Deal creado'); }
            setShowModal(false);
        } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error guardando deal'); }
        finally { setSaving(false); }
    };

    const handleDelete = (id: string) => {
        confirm({ title: '¿Eliminar este deal?', message: 'Esta acción no se puede deshacer.', variant: 'danger' }, async () => {
            try { await onDeleteDeal(id); toast.success('Deal eliminado'); }
            catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error eliminando'); }
        });
    };

    // Drag & drop
    const handleDragStart = (dealId: string) => setDraggedDealId(dealId);
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDrop = async (stage: DealStage) => {
        if (!draggedDealId) return;
        const deal = deals.find(d => d.id === draggedDealId);
        if (deal && deal.stage !== stage) {
            const prob = stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : deal.probability;
            await onUpdateDeal(draggedDealId, { stage, probability: prob });
            toast.success(`Movido a ${DEAL_STAGE_LABELS[stage]}`);
        }
        setDraggedDealId(null);
    };

    return (
        <>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pipeline de Ventas</h1>
                    <p className="text-sm text-gray-500 mt-1">{deals.length} oportunidades</p>
                </div>
                <button onClick={() => openNew()} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
                    <PlusIcon className="w-4 h-4" /> Nuevo Deal
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-gray-200/60 p-4">
                    <div className="text-sm text-gray-500">Deals Activos</div>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">{summary.activeCount}</div>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-gray-200/60 p-4">
                    <div className="text-sm text-gray-500">Valor Pipeline</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">{fmtMoney(summary.totalValue)}</div>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-gray-200/60 p-4">
                    <div className="text-sm text-gray-500">Valor Ponderado</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">{fmtMoney(summary.weightedValue)}</div>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-gray-200/60 p-4">
                    <div className="text-sm text-gray-500">Ganados</div>
                    <div className="text-2xl font-bold text-green-700 mt-1">{fmtMoney(summary.wonValue)}</div>
                    <div className="text-xs text-green-500">{summary.wonCount} deals</div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1100px]">
                    {DEAL_STAGE_ORDER.map(stage => {
                        const stageDeals = dealsByStage[stage];
                        const colors = STAGE_COLORS[stage];
                        const stageTotal = stageDeals.reduce((a, d) => a + d.value, 0);
                        return (
                            <div
                                key={stage}
                                className={`flex-1 min-w-[200px] rounded-xl ${colors.bg} border ${colors.border} flex flex-col`}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(stage)}
                            >
                                {/* Column Header */}
                                <div className={`rounded-t-xl px-3 py-2.5 flex items-center justify-between ${colors.header}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">{DEAL_STAGE_LABELS[stage]}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>{stageDeals.length}</span>
                                    </div>
                                    <button onClick={() => openNew(stage)} className="text-current opacity-60 hover:opacity-100 transition-opacity" title="Agregar deal"><PlusIcon className="w-4 h-4" /></button>
                                </div>
                                {/* Column Value */}
                                {stageTotal > 0 && <div className="px-3 py-1 text-xs font-medium text-gray-500">{fmtMoney(stageTotal)}</div>}
                                {/* Cards */}
                                <div className="p-2 space-y-2 flex-1 min-h-[100px]">
                                    {stageDeals.map(deal => (
                                        <div
                                            key={deal.id}
                                            draggable
                                            onDragStart={() => handleDragStart(deal.id)}
                                            className="bg-white rounded-lg shadow-sm border border-gray-200/80 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-semibold text-gray-800 leading-tight flex-1 mr-2">{deal.title}</h4>
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={() => openEdit(deal)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded"><EditIcon className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDelete(deal.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><TrashIcon className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">{contactName(deal.contactId)}{deal.companyId ? ` • ${companyName(deal.companyId)}` : ''}</div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-800">{fmtMoney(deal.value)}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{deal.probability}%</span>
                                            </div>
                                            {deal.expectedCloseDate && <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(deal.expectedCloseDate).toLocaleDateString('es-MX')}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Deal' : 'Nuevo Deal'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><CancelIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" placeholder="Proyecto web para..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Contacto</label>
                                    <select value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none">
                                        <option value="">Seleccionar...</option>
                                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
                                    <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none">
                                        <option value="">Seleccionar...</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor ($)</label>
                                    <input type="number" min={0} step={100} value={form.value} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Probabilidad (%)</label>
                                    <input type="number" min={0} max={100} value={form.probability} onChange={e => setForm(f => ({ ...f, probability: +e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Cierre esperado</label>
                                    <input type="date" value={form.expectedCloseDate} onChange={e => setForm(f => ({ ...f, expectedCloseDate: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Etapa</label>
                                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as DealStage }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none">
                                    {DEAL_STAGE_ORDER.map(s => <option key={s} value={s}>{DEAL_STAGE_LABELS[s]}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Cotizaciones vinculadas</label>
                                <div className="max-h-32 overflow-y-auto border-2 border-gray-200 rounded-lg p-2 space-y-1">
                                    {quotes.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">No hay cotizaciones disponibles</p> : quotes.slice(0, 20).map(q => (
                                        <label key={q.id} className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-50 rounded px-2 py-1 cursor-pointer">
                                            <input type="checkbox" checked={form.quoteIds.includes(q.id)} onChange={e => {
                                                setForm(f => ({ ...f, quoteIds: e.target.checked ? [...f.quoteIds, q.id] : f.quoteIds.filter(id => id !== q.id) }));
                                            }} className="rounded border-gray-300 text-indigo-600" />
                                            {q.quoteNumber} — {q.clientCompany || q.clientName} ({fmtMoney(q.total)})
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none resize-none" placeholder="Notas sobre el deal..." />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <ConfirmModal {...confirmState} onClose={closeConfirm} />
        </>
    );
};

export default PipelinePage;
