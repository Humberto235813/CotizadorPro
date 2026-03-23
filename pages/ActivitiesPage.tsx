import React, { useState, useMemo } from 'react';
import { Activity, ActivityType, ACTIVITY_TYPE_LABELS } from '../types';
import {
    PlusIcon, CheckIcon, CancelIcon, TrashIcon, EditIcon, CalendarIcon,
    PhoneIcon, EmailIcon, HandshakeIcon, RefreshIcon, UserIcon, BriefcaseIcon
} from '../components/icons/Icons';
import { toast } from 'react-hot-toast';
import { useData } from '../src/contexts/DataContext';
import { useConfirmModal } from '../src/hooks/useConfirmModal';
import ConfirmModal from '../components/ConfirmModal';

const TYPE_ICON_COMPONENTS: Record<ActivityType, React.ReactNode> = {
    call: <PhoneIcon className="w-3.5 h-3.5" />,
    email: <EmailIcon className="w-3.5 h-3.5" />,
    meeting: <HandshakeIcon className="w-3.5 h-3.5" />,
    task: <CheckIcon className="w-3.5 h-3.5" />,
    follow_up: <RefreshIcon className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<ActivityType, string> = {
    call: 'bg-blue-100 text-blue-700 border-blue-200',
    email: 'bg-purple-100 text-purple-700 border-purple-200',
    meeting: 'bg-amber-100 text-amber-700 border-amber-200',
    task: 'bg-green-100 text-green-700 border-green-200',
    follow_up: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

type TabFilter = 'pending' | 'completed' | 'all';

const emptyActivity = (): Omit<Activity, 'id' | 'createdAt'> => ({
    contactId: '', dealId: '', type: 'task', title: '', description: '', dueDate: '', completed: false,
});

const ActivitiesPage: React.FC = () => {
    const { activities, contacts, deals, addActivity: onAddActivity, updateActivity: onUpdateActivity, deleteActivity: onDeleteActivity } = useData();
    const { confirmState, confirm, closeConfirm } = useConfirmModal();
    const [tab, setTab] = useState<TabFilter>('pending');
    const [typeFilter, setTypeFilter] = useState<ActivityType | ''>('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyActivity());
    const [saving, setSaving] = useState(false);

    const filtered = useMemo(() => {
        let list = activities;
        if (tab === 'pending') list = list.filter(a => !a.completed);
        else if (tab === 'completed') list = list.filter(a => a.completed);
        if (typeFilter) list = list.filter(a => a.type === typeFilter);
        // Sort: most recent first (descending by dueDate)
        return list.sort((a, b) => {
            if (!a.completed && !b.completed) return (b.dueDate || '').localeCompare(a.dueDate || '');
            if (a.completed && b.completed) return (b.completedAt || '').localeCompare(a.completedAt || '');
            return a.completed ? 1 : -1;
        });
    }, [activities, tab, typeFilter]);

    // Summary
    const summary = useMemo(() => {
        const pending = activities.filter(a => !a.completed);
        const overdue = pending.filter(a => a.dueDate && new Date(a.dueDate) < new Date());
        const today = pending.filter(a => {
            if (!a.dueDate) return false;
            const d = new Date(a.dueDate);
            const now = new Date();
            return d.toDateString() === now.toDateString();
        });
        return { total: activities.length, pending: pending.length, overdue: overdue.length, today: today.length };
    }, [activities]);

    const contactName = (id?: string) => id ? contacts.find(c => c.id === id)?.name || '' : '';
    const dealTitle = (id?: string) => id ? deals.find(d => d.id === id)?.title || '' : '';

    const openNew = () => { setForm(emptyActivity()); setEditingId(null); setShowModal(true); };
    const openEdit = (a: Activity) => {
        setForm({ contactId: a.contactId || '', dealId: a.dealId || '', type: a.type, title: a.title, description: a.description, dueDate: a.dueDate, completed: a.completed, completedAt: a.completedAt });
        setEditingId(a.id);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('El título es requerido'); return; }
        setSaving(true);
        try {
            if (editingId) { await onUpdateActivity(editingId, form); toast.success('Actividad actualizada'); }
            else { await onAddActivity(form); toast.success('Actividad creada'); }
            setShowModal(false);
        } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error guardando actividad'); }
        finally { setSaving(false); }
    };

    const toggleComplete = async (a: Activity) => {
        const newCompleted = !a.completed;
        await onUpdateActivity(a.id, {
            completed: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : null,
        });
        toast.success(newCompleted ? 'Actividad completada' : 'Actividad reabierta');
    };

    const handleDelete = (id: string) => {
        confirm({ title: '¿Eliminar esta actividad?', message: 'Esta acción no se puede deshacer.', variant: 'danger' }, async () => {
            try { await onDeleteActivity(id); toast.success('Actividad eliminada'); }
            catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error eliminando'); }
        });
    };

    const isOverdue = (a: Activity) => !a.completed && a.dueDate && new Date(a.dueDate) < new Date();
    const isToday = (a: Activity) => {
        if (!a.dueDate) return false;
        return new Date(a.dueDate).toDateString() === new Date().toDateString();
    };

    return (
        <>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Actividades</h1>
                    <p className="text-sm text-gray-500 mt-1">{summary.pending} pendientes · {summary.overdue} vencidas · {summary.today} hoy</p>
                </div>
                <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
                    <PlusIcon className="w-4 h-4" /> Nueva Actividad
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-gray-200/60 p-4">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">{summary.total}</div>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-gray-200/60 p-4">
                    <div className="text-sm text-gray-500">Pendientes</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">{summary.pending}</div>
                </div>
                <div className={`bg-white/90 backdrop-blur rounded-xl shadow-md border p-4 ${summary.overdue > 0 ? 'border-red-300' : 'border-gray-200/60'}`}>
                    <div className="text-sm text-gray-500">Vencidas</div>
                    <div className={`text-2xl font-bold mt-1 ${summary.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{summary.overdue}</div>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-gray-200/60 p-4">
                    <div className="text-sm text-gray-500">Hoy</div>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">{summary.today}</div>
                </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    {([['pending', 'Pendientes'], ['completed', 'Completadas'], ['all', 'Todas']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${tab === key ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
                    ))}
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ActivityType | '')} className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="">Todos los tipos</option>
                    {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map(t => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>)}
                </select>
            </div>

            {/* Activity List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 p-12 text-center">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-400 font-medium">No hay actividades {tab === 'pending' ? 'pendientes' : tab === 'completed' ? 'completadas' : ''}</p>
                    </div>
                ) : filtered.map(a => (
                    <div key={a.id} className={`bg-white/90 backdrop-blur rounded-xl shadow-sm border p-4 flex items-start gap-4 transition-all hover:shadow-md group ${a.completed ? 'border-gray-200/60 opacity-75' : isOverdue(a) ? 'border-red-200 bg-red-50/30' : isToday(a) ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200/60'
                        }`}>
                        {/* Toggle — large clickable area */}
                        <button
                            onClick={() => toggleComplete(a)}
                            title={a.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                            className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${a.completed
                                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                                : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                                }`}
                        >
                            {a.completed && <CheckIcon className="w-4 h-4" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${TYPE_COLORS[a.type]}`}>
                                    {TYPE_ICON_COMPONENTS[a.type]} {ACTIVITY_TYPE_LABELS[a.type]}
                                </span>
                                {isOverdue(a) && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Vencida</span>}
                                {isToday(a) && !a.completed && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">Hoy</span>}
                            </div>
                            <h4 className={`font-semibold mt-1 ${a.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{a.title}</h4>
                            {a.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                                {a.dueDate && <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{new Date(a.dueDate).toLocaleDateString('es-MX')}</span>}
                                {a.contactId && <span className="inline-flex items-center gap-1"><UserIcon className="w-3 h-3" /> {contactName(a.contactId)}</span>}
                                {a.dealId && <span className="inline-flex items-center gap-1"><BriefcaseIcon className="w-3 h-3" /> {dealTitle(a.dealId)}</span>}
                            </div>
                        </div>

                        {/* Actions — always visible */}
                        <div className="flex gap-1 shrink-0">
                            <button onClick={() => toggleComplete(a)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${a.completed ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                {a.completed ? 'Reabrir' : 'Completar'}
                            </button>
                            <button onClick={() => openEdit(a)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Editar"><EditIcon className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(a.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><CancelIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" placeholder="Llamar a cliente para seguimiento..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ActivityType }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none">
                                        {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map(t => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Contacto</label>
                                    <select value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none">
                                        <option value="">Sin contacto</option>
                                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Deal</label>
                                    <select value={form.dealId} onChange={e => setForm(f => ({ ...f, dealId: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none">
                                        <option value="">Sin deal</option>
                                        {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none resize-none" placeholder="Descripción detallada..." />
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

export default ActivitiesPage;
