import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
}

const AuditLogPage: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'auditLog'), orderBy('createdAt', 'desc'), limit(200)),
      (snap) => { setEntries(snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditEntry))); },
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.action?.toLowerCase().includes(q) ||
      e.entity?.toLowerCase().includes(q) ||
      e.userEmail?.toLowerCase().includes(q) ||
      e.details?.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const ACTION_COLORS: Record<string, string> = {
    create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Registro de Auditoría</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Historial de acciones del sistema</p>
      </header>

      <div className="relative max-w-md">
        <input type="text" placeholder="Buscar en el log..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-indigo-500 focus:outline-none" />
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl block mb-3">📝</span>
            <p className="text-gray-400 font-medium">No hay entradas de auditoría</p>
            <p className="text-xs text-gray-400 mt-1">Las acciones del sistema aparecerán aquí</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(e => (
              <div key={e.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${ACTION_COLORS[e.action] || 'bg-gray-100 text-gray-600'}`}>
                  {e.action}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{e.entity}</span>
                  {e.details && <span className="text-xs text-gray-400 ml-2">{e.details}</span>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{e.userEmail}</div>
                  <div className="text-[10px] text-gray-400">{e.createdAt ? new Date(e.createdAt).toLocaleString('es-MX') : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
