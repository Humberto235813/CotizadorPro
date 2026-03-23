import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const ReportsPage: React.FC = () => {
  const { quotes, deals, contacts, activities } = useData();

  // Revenue by month (last 12 months)
  const revenueByMonth = useMemo(() => {
    const months: Record<string, { month: string; cotizado: number; vendido: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      months[key] = { month: label, cotizado: 0, vendido: 0 };
    }
    quotes.forEach(q => {
      const key = q.date?.substring(0, 7);
      if (months[key]) {
        months[key].cotizado += q.total;
        if (q.status === 'sold') months[key].vendido += q.total;
      }
    });
    return Object.values(months);
  }, [quotes]);

  // Deal funnel
  const funnelData = useMemo(() => {
    const stages: Record<string, number> = { prospect: 0, contacted: 0, quoted: 0, negotiation: 0, closed_won: 0, closed_lost: 0 };
    const labels: Record<string, string> = { prospect: 'Prospecto', contacted: 'Contactado', quoted: 'Cotizado', negotiation: 'Negociación', closed_won: 'Ganado', closed_lost: 'Perdido' };
    deals.forEach(d => { stages[d.stage] = (stages[d.stage] || 0) + 1; });
    return Object.entries(stages).map(([key, value]) => ({ name: labels[key] || key, value }));
  }, [deals]);

  // Activity type breakdown
  const activityTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    const labels: Record<string, string> = { call: 'Llamadas', email: 'Correos', meeting: 'Reuniones', task: 'Tareas', follow_up: 'Seguimientos' };
    activities.forEach(a => { types[a.type] = (types[a.type] || 0) + 1; });
    return Object.entries(types).map(([key, value]) => ({ name: labels[key] || key, value }));
  }, [activities]);

  // KPIs
  const kpis = useMemo(() => {
    const totalQuoted = quotes.reduce((a, q) => a + q.total, 0);
    const totalSold = quotes.filter(q => q.status === 'sold').reduce((a, q) => a + q.total, 0);
    const conversionRate = quotes.length > 0 ? (quotes.filter(q => q.status === 'sold').length / quotes.length) * 100 : 0;
    const avgDealValue = deals.length > 0 ? deals.reduce((a, d) => a + d.value, 0) / deals.length : 0;
    const pendingActivities = activities.filter(a => !a.completed).length;
    const overdueActivities = activities.filter(a => !a.completed && a.dueDate && new Date(a.dueDate) < new Date()).length;
    return { totalQuoted, totalSold, conversionRate, avgDealValue, contactCount: contacts.length, pendingActivities, overdueActivities };
  }, [quotes, deals, contacts, activities]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reportes y Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Métricas clave de tu CRM</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Cotizado Total', value: formatCurrency(kpis.totalQuoted), color: 'text-indigo-700 dark:text-indigo-400' },
          { label: 'Vendido Total', value: formatCurrency(kpis.totalSold), color: 'text-green-700 dark:text-green-400' },
          { label: 'Tasa de Conversión', value: `${kpis.conversionRate.toFixed(1)}%`, color: 'text-amber-700 dark:text-amber-400' },
          { label: 'Ticket Promedio', value: formatCurrency(kpis.avgDealValue), color: 'text-purple-700 dark:text-purple-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl shadow-md border border-gray-200/60 dark:border-gray-700/60 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</div>
            <div className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Ingresos por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} tick={{ fill: '#6b7280' }} />
              <YAxis fontSize={12} tick={{ fill: '#6b7280' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="cotizado" name="Cotizado" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vendido" name="Vendido" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel Chart */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Funnel de Ventas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" fontSize={12} tick={{ fill: '#6b7280' }} />
              <YAxis dataKey="name" type="category" fontSize={12} tick={{ fill: '#6b7280' }} width={100} />
              <Tooltip />
              <Bar dataKey="value" name="Deals" radius={[0, 4, 4, 0]}>
                {funnelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Pie */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Actividades por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={activityTypeData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {activityTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Resumen General</h3>
          <div className="space-y-4">
            {[
              { label: 'Contactos', value: kpis.contactCount, icon: '👥' },
              { label: 'Cotizaciones', value: quotes.length, icon: '📋' },
              { label: 'Deals Activos', value: deals.filter(d => !d.stage.startsWith('closed')).length, icon: '🎯' },
              { label: 'Actividades Pendientes', value: kpis.pendingActivities, icon: '📌', alert: kpis.overdueActivities > 0 },
              { label: 'Actividades Vencidas', value: kpis.overdueActivities, icon: '🔴', alert: true },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
                </div>
                <span className={`text-lg font-bold ${stat.alert ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
