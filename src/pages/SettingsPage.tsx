import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preferencias del sistema</p>
      </header>

      {/* Profile Section */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Perfil</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Nombre</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.displayName || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Rol</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${userProfile?.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
              {userProfile?.role === 'admin' ? 'Administrador' : 'Usuario'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Último acceso</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleString('es-MX') : '—'}</span>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Apariencia</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Tema oscuro</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cambia entre modo claro y oscuro</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isDark ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center text-xs ${isDark ? 'translate-x-7' : ''}`}>
              {isDark ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Sistema</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Versión</span><span className="text-gray-800 dark:text-gray-200 font-mono">2.0.0</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Stack</span><span className="text-gray-800 dark:text-gray-200">React 19 + Vite + Firebase</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Proyecto Firebase</span><span className="text-gray-800 dark:text-gray-200 font-mono">cotizador-10894</span></div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
