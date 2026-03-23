import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import ConfirmModal from '../../components/ConfirmModal';
import { getAllUsers, adminUpdateUser, adminDeleteUser } from '../../firebase';
import { UserProfile } from '../../types';
import { toast } from 'react-hot-toast';

const UserManagementPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { companies } = useData();
  const { confirmState, confirm, closeConfirm } = useConfirmModal();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ companyId: string; role: 'admin' | 'user' }>({ companyId: '', role: 'user' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await getAllUsers();
      setUsers(all);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Acceso Denegado</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Solo administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.status === 'active' || (!u.status && u.role));
  const pendingUsers = users.filter(u => u.status === 'pending');
  const disabledUsers = users.filter(u => u.status === 'disabled');

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return '—';
    return companies.find(c => c.id === companyId)?.name || companyId;
  };

  const handleApprove = async (uid: string) => {
    try {
      await adminUpdateUser(uid, { status: 'active' });
      toast.success('Usuario aprobado');
      loadUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error aprobando');
    }
  };

  const handleReject = (uid: string) => {
    confirm({ title: '¿Rechazar este usuario?', message: 'El usuario será marcado como deshabilitado.', variant: 'danger' }, async () => {
      try {
        await adminUpdateUser(uid, { status: 'disabled' });
        toast.success('Usuario rechazado');
        loadUsers();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error rechazando');
      }
    });
  };

  const handleDelete = (uid: string, name: string) => {
    confirm({ title: `¿Eliminar a ${name}?`, message: 'Esta acción eliminará el perfil del usuario. No podrá acceder al sistema.', variant: 'danger' }, async () => {
      try {
        await adminDeleteUser(uid);
        toast.success('Usuario eliminado');
        loadUsers();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error eliminando');
      }
    });
  };

  const handleSaveEdit = async (uid: string) => {
    try {
      await adminUpdateUser(uid, { companyId: editForm.companyId || undefined, role: editForm.role });
      toast.success('Usuario actualizado');
      setEditingUid(null);
      loadUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error actualizando');
    }
  };

  const handleToggleDisable = async (u: UserProfile) => {
    const newStatus = u.status === 'disabled' ? 'active' : 'disabled';
    try {
      await adminUpdateUser(u.uid, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Usuario reactivado' : 'Usuario deshabilitado');
      loadUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error cambiando estado');
    }
  };

  const UserRow = ({ u }: { u: UserProfile }) => {
    const isEditing = editingUid === u.uid;
    return (
      <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(u.displayName || u.email || '?').split(/[\s@]+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.displayName || '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          {isEditing ? (
            <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))} className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
            </select>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
              {u.role === 'admin' ? 'Admin' : 'Usuario'}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {isEditing ? (
            <select value={editForm.companyId} onChange={e => setEditForm(f => ({ ...f, companyId: e.target.value }))} className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              <option value="">Sin asignar</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <span className={`text-sm ${u.companyId ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 italic'}`}>{getCompanyName(u.companyId)}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            u.status === 'active' || !u.status ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : u.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {u.status === 'active' || !u.status ? 'Activo' : u.status === 'pending' ? 'Pendiente' : 'Deshabilitado'}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button onClick={() => handleSaveEdit(u.uid)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">Guardar</button>
                <button onClick={() => setEditingUid(null)} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 transition-colors">Cancelar</button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditingUid(u.uid); setEditForm({ companyId: u.companyId || '', role: u.role }); }} className="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Editar">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleToggleDisable(u)} className={`text-xs px-2 py-1 rounded transition-colors ${u.status === 'disabled' ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30' : 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'}`} title={u.status === 'disabled' ? 'Reactivar' : 'Deshabilitar'}>
                  {u.status === 'disabled' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  )}
                </button>
                <button onClick={() => handleDelete(u.uid, u.displayName || u.email)} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Eliminar">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeUsers.length} activos · {pendingUsers.length} pendientes · {disabledUsers.length} deshabilitados
          </p>
        </div>
        <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refrescar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button onClick={() => setActiveTab('active')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'active' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
          Usuarios Activos ({activeUsers.length})
        </button>
        <button onClick={() => setActiveTab('pending')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all relative ${activeTab === 'pending' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
          Pendientes
          {pendingUsers.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full animate-pulse">{pendingUsers.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'active' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Rol</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Último Login</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[...activeUsers, ...disabledUsers].map(u => <UserRow key={u.uid} u={u} />)}
                  </tbody>
                </table>
              </div>
              {activeUsers.length === 0 && disabledUsers.length === 0 && (
                <div className="text-center py-12 text-gray-400">No hay usuarios registrados.</div>
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingUsers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Sin usuarios pendientes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Todos los usuarios han sido procesados.</p>
                </div>
              ) : (
                pendingUsers.map(u => (
                  <div key={u.uid} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-800/40 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold">
                        {(u.displayName || u.email || '?').split(/[\s@]+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{u.displayName || '—'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Registrado: {new Date(u.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        defaultValue=""
                        onChange={e => {
                          if (e.target.value) {
                            adminUpdateUser(u.uid, { companyId: e.target.value }).then(() => loadUsers());
                          }
                        }}
                        className="text-sm border rounded-lg px-3 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      >
                        <option value="">Asignar empresa...</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button onClick={() => handleApprove(u.uid)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                        ✓ Aprobar
                      </button>
                      <button onClick={() => handleReject(u.uid)} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
                        ✕ Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      <ConfirmModal {...confirmState} onClose={closeConfirm} />
    </div>
  );
};

export default UserManagementPage;
