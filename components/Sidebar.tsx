import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DashboardIcon, BuildingIcon, BriefcaseIcon, ContactsIcon,
  PipelineIcon, ActivityIcon
} from './icons/Icons';
import { useAuth } from '../src/contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: <DashboardIcon className="h-5 w-5" />, label: 'Dashboard' },
  { to: '/companies', icon: <BuildingIcon className="h-5 w-5" />, label: 'Empresas' },
];

const crmItems = [
  { to: '/clients', icon: <ContactsIcon className="h-5 w-5" />, label: 'Clientes' },
  { to: '/pipeline', icon: <PipelineIcon className="h-5 w-5" />, label: 'Pipeline' },
  { to: '/activities', icon: <ActivityIcon className="h-5 w-5" />, label: 'Actividades' },
  { to: '/calendar', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>, label: 'Calendario' },
  { to: '/email', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>, label: 'Correo Masivo' },
];

const toolItems = [
  { to: '/reports', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>, label: 'Reportes' },
  { to: '/products', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>, label: 'Productos' },
  { to: '/users', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>, label: 'Usuarios', adminOnly: true },
  { to: '/settings', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: 'Configuración' },
];

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onNavigate?: () => void }> = ({ to, icon, label, onNavigate }) => (
  <li>
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `w-full flex items-center p-3 my-0.5 rounded-lg text-left transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          isActive
            ? 'bg-white/70 dark:bg-gray-700/70 shadow-md'
            : 'hover:bg-white/50 dark:hover:bg-gray-700/40 text-gray-600 dark:text-gray-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`transition-colors ${isActive ? 'text-indigo-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-500'}`}>
            {icon}
          </span>
          <span className={`ml-3 font-medium text-sm transition-colors ${isActive ? 'text-gray-800 dark:text-white' : 'group-hover:text-gray-800 dark:group-hover:text-white'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  </li>
);

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="mt-5 mb-1 px-3">
    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
      <div className="flex-1 h-px bg-gray-300/60 dark:bg-gray-600/60" />
      {label}
      <div className="flex-1 h-px bg-gray-300/60 dark:bg-gray-600/60" />
    </div>
  </div>
);

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-md border border-white/30 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all"
        aria-label="Abrir menú"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40
        w-60 h-screen flex flex-col
        bg-gradient-to-b from-white/60 to-gray-100/70 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl
        border-r border-white/30 dark:border-gray-700/30 p-3
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between mb-4 p-3">
          <div className="flex items-center">
            <img src="/logo-grv.png" alt="GRV" className="h-9 w-9 rounded-lg object-cover" />
            <div className="ml-3">
              <h1 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">CRM</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">by Servicios GRV</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 p-1"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul>
            {navItems.map(item => (
              <NavItem key={item.to} {...item} onNavigate={() => setIsOpen(false)} />
            ))}
          </ul>

          <SectionLabel label="CRM" />
          <ul>
            {crmItems.map(item => (
              <NavItem key={item.to} {...item} onNavigate={() => setIsOpen(false)} />
            ))}
          </ul>

          <SectionLabel label="Herramientas" />
          <ul>
            {toolItems.filter(item => !('adminOnly' in item) || (item as {adminOnly?: boolean}).adminOnly !== true || isAdmin).map(item => (
              <NavItem key={item.to} {...item} onNavigate={() => setIsOpen(false)} />
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="mt-auto text-[10px] text-gray-400 dark:text-gray-500 px-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          CRM by Servicios GRV v3.0
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
