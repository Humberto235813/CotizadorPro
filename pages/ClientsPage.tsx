import React, { useState, useMemo } from 'react';
import { Contact, ACTIVITY_TYPE_LABELS } from '../types';
import {
    PlusIcon, TrashIcon, EditIcon, UserIcon, EmailIcon, PhoneIcon,
    LocationIcon, CompanyIcon, TagIcon, CheckIcon, CancelIcon, NoteIcon
} from '../components/icons/Icons';
import { toast } from 'react-hot-toast';
import { seedCrmFromQuotes } from '../utils/seedCrmFromQuotes';
import { useData } from '../src/contexts/DataContext';
import { useConfirmModal } from '../src/hooks/useConfirmModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency } from '../src/utils/format';

const TAG_COLORS: Record<string, string> = {
    VIP: 'bg-amber-100 text-amber-800 border-amber-200',
    Frecuente: 'bg-green-100 text-green-800 border-green-200',
    Nuevo: 'bg-blue-100 text-blue-800 border-blue-200',
    Inactivo: 'bg-gray-100 text-gray-600 border-gray-200',
    Potencial: 'bg-purple-100 text-purple-800 border-purple-200',
};

const SOURCE_OPTIONS = ['Referido', 'Web', 'LinkedIn', 'Llamada', 'Email', 'Evento', 'Otro'];
const DEFAULT_TAGS = ['VIP', 'Frecuente', 'Nuevo', 'Inactivo', 'Potencial'];

const emptyForm = (): Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> => ({
    name: '', company: '', email: '', phone: '', address: '', tags: [], source: '', notes: '',
});

const ClientsPage: React.FC = () => {
    const { contacts, quotes, deals, activities, addContact: onAddContact, updateContact: onUpdateContact, deleteContact: onDeleteContact } = useData();
    const { confirmState, confirm, closeConfirm } = useConfirmModal();
    const [search, setSearch] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);

    // Filtered contacts
    const filtered = useMemo(() => {
        let list = contacts;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.company.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q)
            );
        }
        if (tagFilter) {
            list = list.filter(c => c.tags.includes(tagFilter));
        }
        return list;
    }, [contacts, search, tagFilter]);

    // Contact stats (for the selected contact)
    const contactStats = useMemo(() => {
        if (!selectedContact) return null;
        const cQuotes = quotes.filter(q =>
            q.contactId === selectedContact.id ||
            q.clientEmail === selectedContact.email
        );
        const cDeals = deals.filter(d => d.contactId === selectedContact.id);
        const cActivities = activities.filter(a => a.contactId === selectedContact.id);
        const totalRevenue = cQuotes.filter(q => q.status === 'sold').reduce((a, q) => a + q.total, 0);
        return { quotes: cQuotes, deals: cDeals, activities: cActivities, totalRevenue };
    }, [selectedContact, quotes, deals, activities]);

    const allTags = useMemo(() => {
        const set = new Set(DEFAULT_TAGS);
        contacts.forEach(c => c.tags?.forEach(t => set.add(t)));
        return Array.from(set);
    }, [contacts]);

    const openNew = () => { setForm(emptyForm()); setEditingId(null); setShowModal(true); };

    const openEdit = (c: Contact) => {
        setForm({ name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address, tags: c.tags || [], source: c.source || '', notes: c.notes || '' });
        setEditingId(c.id);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
        setSaving(true);
        try {
            if (editingId) {
                await onUpdateContact(editingId, form);
                toast.success('Contacto actualizado');
            } else {
                await onAddContact(form);
                toast.success('Contacto creado');
            }
            setShowModal(false);
        } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error guardando contacto'); }
        finally { setSaving(false); }
    };

    const handleDelete = (id: string) => {
        confirm({ title: '¿Eliminar este contacto?', message: 'Esta acción no se puede deshacer.', variant: 'danger' }, async () => {
            try { await onDeleteContact(id); toast.success('Contacto eliminado'); if (selectedContact?.id === id) setSelectedContact(null); }
            catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error eliminando contacto'); }
        });
    };

    const toggleTag = (tag: string) => {
        setForm(f => ({
            ...f,
            tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
        }));
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

    return (
        <>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                    <p className="text-sm text-gray-500 mt-1">{contacts.length} contactos en total</p>
                </div>
                <div className="flex items-center gap-3">
                    {contacts.length === 0 && (
                        <button
                            onClick={async () => {
                                setSeeding(true);
                                try {
                                    const r = await seedCrmFromQuotes();
                                    toast.success(`Importación lista: ${r.contactsCreated} contactos, ${r.dealsCreated} deals, ${r.activitiesCreated} actividades`);
                                } catch (err: unknown) {
                                    toast.error(err instanceof Error ? err.message : 'Error en la importación');
                                } finally { setSeeding(false); }
                            }}
                            disabled={seeding}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <svg className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            {seeding ? 'Importando...' : 'Importar de Cotizaciones'}
                        </button>
                    )}
                    <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
                        <PlusIcon className="w-4 h-4" /> Nuevo Contacto
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <input
                        type="text" placeholder="Buscar por nombre, empresa, email..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="">Todos los tags</option>
                    {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Content: Table + Detail Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Table */}
                <div className={`${selectedContact ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr className="text-left text-gray-600 font-semibold text-xs uppercase tracking-wider">
                                        <th className="p-4">Contacto</th>
                                        <th className="p-4">Empresa</th>
                                        <th className="p-4">Tags</th>
                                        <th className="p-4">Fuente</th>
                                        <th className="p-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-gray-400"><UserIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />No se encontraron contactos</td></tr>
                                    ) : filtered.map(c => (
                                        <tr key={c.id} onClick={() => setSelectedContact(c)} className={`border-t border-gray-100 hover:bg-indigo-50/40 cursor-pointer transition-colors ${selectedContact?.id === c.id ? 'bg-indigo-50/60' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{c.name}</div>
                                                        {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                                                        {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-700">{c.company || '—'}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(c.tags || []).map(t => (
                                                        <span key={t} className={`text-xs px-2 py-0.5 rounded-full border ${TAG_COLORS[t] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{t}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600 text-xs">{c.source || '—'}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={e => { e.stopPropagation(); openEdit(c); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Editar"><EditIcon className="w-4 h-4" /></button>
                                                    <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedContact && contactStats && (
                    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 p-5 space-y-5 h-fit sticky top-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                                    {selectedContact.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{selectedContact.name}</h3>
                                    <p className="text-xs text-gray-500">{selectedContact.company}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedContact(null)} className="text-gray-400 hover:text-gray-600 p-1"><CancelIcon className="w-4 h-4" /></button>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 text-sm">
                            {selectedContact.email && <div className="flex items-center gap-2 text-gray-600"><EmailIcon className="w-4 h-4 text-gray-400" />{selectedContact.email}</div>}
                            {selectedContact.phone && <div className="flex items-center gap-2 text-gray-600"><PhoneIcon className="w-4 h-4 text-gray-400" />{selectedContact.phone}</div>}
                            {selectedContact.address && <div className="flex items-center gap-2 text-gray-600"><LocationIcon className="w-4 h-4 text-gray-400" />{selectedContact.address}</div>}
                        </div>

                        {/* Tags */}
                        {(selectedContact.tags || []).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {selectedContact.tags.map(t => <span key={t} className={`text-xs px-2 py-0.5 rounded-full border ${TAG_COLORS[t] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{t}</span>)}
                            </div>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-indigo-50 rounded-xl p-3 text-center">
                                <div className="text-xl font-bold text-indigo-700">{contactStats.quotes.length}</div>
                                <div className="text-xs text-indigo-500">Cotizaciones</div>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3 text-center">
                                <div className="text-xl font-bold text-green-700">{formatCurrency(contactStats.totalRevenue)}</div>
                                <div className="text-xs text-green-500">Facturado</div>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-3 text-center">
                                <div className="text-xl font-bold text-amber-700">{contactStats.deals.length}</div>
                                <div className="text-xs text-amber-500">Deals</div>
                            </div>
                            <div className="bg-violet-50 rounded-xl p-3 text-center">
                                <div className="text-xl font-bold text-violet-700">{contactStats.activities.filter(a => !a.completed).length}</div>
                                <div className="text-xs text-violet-500">Pendientes</div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        {contactStats.activities.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Actividad Reciente</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {contactStats.activities.slice(0, 5).map(a => (
                                        <div key={a.id} className="flex items-center gap-2 text-xs text-gray-600">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${a.completed ? 'bg-green-400' : 'bg-amber-400'}`} />
                                            <span className="font-medium">{ACTIVITY_TYPE_LABELS[a.type]}</span>
                                            <span className="text-gray-400 truncate">{a.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {selectedContact.notes && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notas</h4>
                                <p className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-2">{selectedContact.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Add/Edit Contact */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Contacto' : 'Nuevo Contacto'}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                                    <div className="relative">
                                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" placeholder="Juan Pérez" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
                                    <div className="relative">
                                        <CompanyIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" placeholder="Acme Corp" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                                    <div className="relative">
                                        <EmailIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" placeholder="email@empresa.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                                    <div className="relative">
                                        <PhoneIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" placeholder="55 1234 5678" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                                <div className="relative">
                                    <LocationIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" placeholder="Av. Reforma 123, CDMX" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Fuente</label>
                                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none">
                                    <option value="">Seleccionar fuente...</option>
                                    {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button key={tag} type="button" onClick={() => toggleTag(tag)}
                                            className={`text-xs px-3 py-1 rounded-full border transition-all ${form.tags.includes(tag) ? `${TAG_COLORS[tag] || 'bg-indigo-100 text-indigo-700 border-indigo-200'} ring-2 ring-indigo-300` : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                                            {form.tags.includes(tag) && <CheckIcon className="w-3 h-3 inline mr-1" />}{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none resize-none" placeholder="Notas sobre el contacto..." />
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

export default ClientsPage;
