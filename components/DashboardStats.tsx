import React from 'react';
import { Quote } from '../types';
import { ChartBarIcon, DollarSignIcon, ClockIcon, TrendUpIcon, GemIcon, CalendarIcon } from './icons/Icons';

interface DashboardStatsProps {
  quotes: Quote[];
  companies: Array<{ id: string; name: string }>;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ quotes, companies }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calcular estadísticas
  const totalQuotes = quotes.length;
  const createdQuotes = quotes.filter(q => q.status === 'created').length;
  const soldQuotes = quotes.filter(q => q.status === 'sold').length;
  const draftQuotes = quotes.filter(q => q.status === 'draft').length;

  const totalValue = quotes.reduce((sum, q) => sum + q.total, 0);
  const soldValue = quotes.filter(q => q.status === 'sold').reduce((sum, q) => sum + q.total, 0);
  const pendingValue = quotes.filter(q => q.status === 'created').reduce((sum, q) => sum + q.total, 0);

  const conversionRate = createdQuotes + soldQuotes > 0
    ? (soldQuotes / (createdQuotes + soldQuotes)) * 100
    : 0;

  // Estadísticas del mes actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthQuotes = quotes.filter(q => {
    const quoteDate = new Date(q.date);
    return quoteDate.getMonth() === currentMonth && quoteDate.getFullYear() === currentYear;
  });

  const thisMonthValue = thisMonthQuotes.reduce((sum, q) => sum + q.total, 0);
  const thisMonthSold = thisMonthQuotes.filter(q => q.status === 'sold').reduce((sum, q) => sum + q.total, 0);

  // ── Time-based proposal indicators ──
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayQuotes = quotes.filter(q => {
    const d = new Date(q.date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });

  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const thisWeekQuotes = quotes.filter(q => new Date(q.date) >= weekAgo);

  // Quarter
  const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1);
  const thisQuarterQuotes = quotes.filter(q => new Date(q.date) >= quarterStart && new Date(q.date).getFullYear() === currentYear);

  const thisYearQuotes = quotes.filter(q => new Date(q.date).getFullYear() === currentYear);

  // Previous period comparisons
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayQuotes = quotes.filter(q => {
    const d = new Date(q.date);
    return d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
  });

  const prevWeekStart = new Date(weekAgo);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekQuotes = quotes.filter(q => {
    const d = new Date(q.date);
    return d >= prevWeekStart && d < weekAgo;
  });

  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthEnd = new Date(currentYear, currentMonth, 0);
  const prevMonthQuotes = quotes.filter(q => {
    const d = new Date(q.date);
    return d >= prevMonthStart && d <= prevMonthEnd;
  });

  const timePeriods = [
    {
      label: 'Hoy',
      count: todayQuotes.length,
      value: todayQuotes.reduce((s, q) => s + q.total, 0),
      prevCount: yesterdayQuotes.length,
      accent: 'bg-indigo-500',
      light: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Esta Semana',
      count: thisWeekQuotes.length,
      value: thisWeekQuotes.reduce((s, q) => s + q.total, 0),
      prevCount: prevWeekQuotes.length,
      accent: 'bg-blue-500',
      light: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Este Mes',
      count: thisMonthQuotes.length,
      value: thisMonthQuotes.reduce((s, q) => s + q.total, 0),
      prevCount: prevMonthQuotes.length,
      accent: 'bg-violet-500',
      light: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Este Trimestre',
      count: thisQuarterQuotes.length,
      value: thisQuarterQuotes.reduce((s, q) => s + q.total, 0),
      prevCount: null,
      accent: 'bg-amber-500',
      light: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Este Año',
      count: thisYearQuotes.length,
      value: thisYearQuotes.reduce((s, q) => s + q.total, 0),
      prevCount: null,
      accent: 'bg-emerald-500',
      light: 'bg-emerald-50 text-emerald-700',
    },
  ];

  const getDelta = (current: number, prev: number | null) => {
    if (prev === null || prev === 0) return null;
    return Math.round(((current - prev) / prev) * 100);
  };

  const stats = [
    {
      title: 'Total de Cotizaciones',
      value: totalQuotes.toString(),
      icon: <ChartBarIcon className="w-7 h-7" />,
      subtitle: `${createdQuotes} activas, ${soldQuotes} vendidas, ${draftQuotes} borradores`,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900'
    },
    {
      title: 'Ventas Realizadas',
      value: formatCurrency(soldValue),
      icon: <DollarSignIcon className="w-7 h-7" />,
      subtitle: `${soldQuotes} cotizaciones vendidas`,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900'
    },
    {
      title: 'Ventas Pendientes',
      value: formatCurrency(pendingValue),
      icon: <ClockIcon className="w-7 h-7" />,
      subtitle: `${createdQuotes} cotizaciones en proceso`,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-900'
    },
    {
      title: 'Tasa de Conversión',
      value: `${conversionRate.toFixed(1)}%`,
      icon: <TrendUpIcon className="w-7 h-7" />,
      subtitle: `${soldQuotes} de ${createdQuotes + soldQuotes} convertidas`,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900'
    },
    {
      title: 'Valor Total',
      value: formatCurrency(totalValue),
      icon: <GemIcon className="w-7 h-7" />,
      subtitle: 'Suma de todas las cotizaciones',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-900'
    },
    {
      title: 'Ventas del Mes',
      value: formatCurrency(thisMonthSold),
      icon: <CalendarIcon className="w-7 h-7" />,
      subtitle: `${thisMonthQuotes.filter(q => q.status === 'sold').length} vendidas este mes`,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      textColor: 'text-cyan-900'
    }
  ];

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ChartBarIcon className="w-6 h-6 text-indigo-600" /> Resumen General</h2>
        <p className="text-gray-600 text-sm mt-1">Métricas clave de tu negocio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group"
          >
            <div className={`h-1.5 bg-gradient-to-r ${stat.color}`}></div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Propuestas Enviadas — compact strip ── */}
      <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <CalendarIcon className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-700">Propuestas Enviadas</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {timePeriods.map((p, i) => {
            const delta = getDelta(p.count, p.prevCount);
            return (
              <div key={i} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg ${p.light} border border-transparent`}>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">{p.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold">{p.count}</span>
                    <span className="text-[10px] opacity-60">{formatCurrency(p.value)}</span>
                  </div>
                </div>
                {delta !== null && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {delta >= 0 ? '+' : ''}{delta}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
