import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const UserProfileHeader: React.FC = () => {
  const { user, userProfile, handleLogout, handleUpdateDisplayName } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const initials = (user.displayName || user.email || '?')
    .split(/[\s@]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await handleUpdateDisplayName(trimmed);
      setEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'No se pudo actualizar el nombre');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setName(user.displayName || ''); setEditing(false); }
  };

  return (
    <div className="mb-4 flex justify-end items-center gap-3">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 hover:scale-105 transition-all shadow-sm"
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
      >
        {isDark ? (
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Shortcut hint */}
      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-xs hover:border-indigo-300 transition-all shadow-sm"
        title="Búsqueda global (⌘K)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span>Buscar</span>
        <kbd className="border border-gray-300 dark:border-gray-500 rounded px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>

      {/* User Info */}
      <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner shrink-0">
          {initials}
        </div>
        <div className="text-right min-w-0">
          <div className="flex items-center gap-2 justify-end mb-0.5">
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={saving}
                  className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-indigo-400 bg-transparent outline-none px-1 py-0 w-40"
                  placeholder="Tu nombre"
                />
                <button onClick={handleSave} disabled={saving || !name.trim()} className="text-green-600 hover:text-green-700 disabled:opacity-40 p-0.5" title="Guardar">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
                <button onClick={() => { setName(user.displayName || ''); setEditing(false); }} className="text-gray-400 hover:text-gray-600 p-0.5" title="Cancelar">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                  {user.displayName || user.email}
                </p>
                <button onClick={() => { setName(user.displayName || ''); setEditing(true); }} className="text-gray-400 hover:text-indigo-600 transition-colors p-0.5" title="Editar nombre">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </>
            )}
            {userProfile && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${userProfile.role === 'admin'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                {userProfile.role === 'admin' ? 'Admin' : 'Usuario'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm font-medium"
          title="Cerrar sesión"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Salir
        </button>
      </div>
    </div>
  );
};

export default UserProfileHeader;
