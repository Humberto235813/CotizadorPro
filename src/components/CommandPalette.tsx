import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/format';

interface SearchResult {
  type: 'contact' | 'deal' | 'quote' | 'company' | 'page';
  id: string;
  title: string;
  subtitle: string;
  path: string;
  icon: string;
}

const PAGES: SearchResult[] = [
  { type: 'page', id: 'dashboard', title: 'Dashboard', subtitle: 'Inicio y resumen', path: '/dashboard', icon: '📊' },
  { type: 'page', id: 'clients', title: 'Clientes', subtitle: 'Gestión de contactos', path: '/clients', icon: '👥' },
  { type: 'page', id: 'pipeline', title: 'Pipeline', subtitle: 'Kanban de ventas', path: '/pipeline', icon: '🎯' },
  { type: 'page', id: 'activities', title: 'Actividades', subtitle: 'Tareas y seguimientos', path: '/activities', icon: '✅' },
  { type: 'page', id: 'reports', title: 'Reportes', subtitle: 'Analytics y métricas', path: '/reports', icon: '📈' },
  { type: 'page', id: 'products', title: 'Productos', subtitle: 'Catálogo de servicios', path: '/products', icon: '📦' },
  { type: 'page', id: 'calendar', title: 'Calendario', subtitle: 'Vista de actividades', path: '/calendar', icon: '📅' },
  { type: 'page', id: 'companies', title: 'Empresas', subtitle: 'Administración', path: '/companies', icon: '🏢' },
  { type: 'page', id: 'settings', title: 'Configuración', subtitle: 'Preferencias del sistema', path: '/settings', icon: '⚙️' },
  { type: 'page', id: 'quotes-new', title: 'Nueva Cotización', subtitle: 'Crear cotización', path: '/quotes/new', icon: '➕' },
];

const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { contacts, deals, quotes, companies } = useData();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return PAGES;

    const q = query.toLowerCase();
    const matched: SearchResult[] = [];

    // Pages
    PAGES.forEach(p => {
      if (p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)) {
        matched.push(p);
      }
    });

    // Contacts
    contacts.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)) {
        matched.push({
          type: 'contact', id: c.id, title: c.name,
          subtitle: c.company || c.email || '', path: '/clients', icon: '👤',
        });
      }
    });

    // Deals
    deals.forEach(d => {
      if (d.title.toLowerCase().includes(q)) {
        matched.push({
          type: 'deal', id: d.id, title: d.title,
          subtitle: formatCurrency(d.value), path: '/pipeline', icon: '💰',
        });
      }
    });

    // Quotes
    quotes.forEach(q2 => {
      if (q2.quoteNumber?.toLowerCase().includes(q) || q2.clientName?.toLowerCase().includes(q) || q2.clientCompany?.toLowerCase().includes(q)) {
        matched.push({
          type: 'quote', id: q2.id, title: `${q2.quoteNumber} — ${q2.clientCompany || q2.clientName}`,
          subtitle: formatCurrency(q2.total), path: '/dashboard', icon: '📋',
        });
      }
    });

    // Companies
    companies.forEach(c => {
      if (c.name.toLowerCase().includes(q)) {
        matched.push({
          type: 'company', id: c.id, title: c.name,
          subtitle: c.address || '', path: '/companies', icon: '🏢',
        });
      }
    });

    return matched.slice(0, 15);
  }, [query, contacts, deals, quotes, companies]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].path);
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
            placeholder="Buscar contactos, deals, cotizaciones, páginas..."
          />
          <kbd className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Sin resultados para &ldquo;{query}&rdquo;</div>
          ) : results.map((r, idx) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => { navigate(r.path); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                idx === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="text-lg shrink-0">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.title}</div>
                <div className="text-xs text-gray-400 truncate">{r.subtitle}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 shrink-0">{r.type === 'page' ? 'Página' : r.type}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="border border-gray-300 dark:border-gray-600 rounded px-1">↑↓</kbd> Navegar</span>
          <span><kbd className="border border-gray-300 dark:border-gray-600 rounded px-1">↵</kbd> Seleccionar</span>
          <span><kbd className="border border-gray-300 dark:border-gray-600 rounded px-1">esc</kbd> Cerrar</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
