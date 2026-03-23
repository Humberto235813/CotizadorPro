import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import { useConfirmModal } from '../hooks/useConfirmModal';
import ConfirmModal from '../../components/ConfirmModal';
import { db } from '../../firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'MXN' | 'USD';
  category: string;
  sku: string;
  active: boolean;
  createdAt: string;
}

const CATEGORIES = ['Servicios', 'Consultoría', 'Desarrollo', 'Diseño', 'Marketing', 'Licencias', 'Hardware', 'Otro'];

const ProductCatalog: React.FC = () => {
  const { userProfile } = useAuth();
  const { confirmState, confirm, closeConfirm } = useConfirmModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', price: 0, currency: 'MXN' as 'MXN' | 'USD',
    category: '', sku: '', active: true,
  });

  React.useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'products'), orderBy('name')),
      (snap: QuerySnapshot<DocumentData>) => { setProducts(snap.docs.map((d) => ({ ...d.data(), id: d.id } as Product))); },
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (categoryFilter) list = list.filter(p => p.category === categoryFilter);
    return list;
  }, [products, search, categoryFilter]);

  const openNew = () => { setForm({ name: '', description: '', price: 0, currency: 'MXN', category: '', sku: '', active: true }); setEditingId(null); setShowModal(true); };
  const openEdit = (p: Product) => { setForm({ name: p.name, description: p.description, price: p.price, currency: p.currency || 'MXN', category: p.category, sku: p.sku || '', active: p.active !== false }); setEditingId(p.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    if (form.price <= 0) { toast.error('El precio debe ser mayor a 0'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), form);
        toast.success('Producto actualizado');
      } else {
        await addDoc(collection(db, 'products'), { ...form, createdAt: new Date().toISOString() });
        toast.success('Producto creado');
      }
      setShowModal(false);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error guardando producto'); }
    finally { setSaving(false); }
  };

  const handleDelete = (p: Product) => {
    confirm(
      { title: 'Eliminar Producto', message: `¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`, variant: 'danger' },
      async () => {
        await deleteDoc(doc(db, 'products', p.id));
        toast.success('Producto eliminado');
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Catálogo de Productos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{products.length} productos / servicios</p>
        </div>
        {userProfile?.role === 'admin' && (
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input type="text" placeholder="Buscar por nombre, SKU..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm" />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-indigo-500 focus:outline-none">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-12 text-center">
            <span className="text-4xl block mb-3">📦</span>
            <p className="text-gray-400 font-medium mb-3">No hay productos</p>
            {userProfile?.role === 'admin' && (
              <button onClick={openNew} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">Crear el primero →</button>
            )}
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 p-5 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">{p.name}</h4>
                {p.sku && <span className="text-[10px] text-gray-400 font-mono">{p.sku}</span>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.active !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                {p.active !== false ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {p.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{p.description}</p>}
            {p.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">{p.category}</span>}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(p.price, p.currency || 'MXN')}</span>
              {userProfile?.role === 'admin' && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(p)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700"><h2 className="text-lg font-bold text-gray-800 dark:text-white">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-indigo-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-indigo-500 focus:outline-none resize-none" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Precio *</label>
                  <input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-indigo-500 focus:outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Moneda</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as 'MXN' | 'USD' }))} className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-indigo-500 focus:outline-none">
                    <option value="MXN">MXN</option><option value="USD">USD</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SKU</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-indigo-500 focus:outline-none" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Categoría</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:border-indigo-500 focus:outline-none">
                  <option value="">Seleccionar...</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Producto activo</span>
              </label>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={confirmState.isOpen} onClose={closeConfirm} onConfirm={confirmState.onConfirm} title={confirmState.title} message={confirmState.message} variant={confirmState.variant} />
    </div>
  );
};

export default ProductCatalog;
