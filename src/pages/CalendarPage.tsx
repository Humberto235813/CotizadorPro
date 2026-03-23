import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { ACTIVITY_TYPE_LABELS, ActivityType } from '../../types';

const TYPE_COLORS: Record<ActivityType, string> = {
  call: 'bg-blue-500', email: 'bg-purple-500', meeting: 'bg-amber-500',
  task: 'bg-green-500', follow_up: 'bg-indigo-500',
};

const CalendarPage: React.FC = () => {
  const { activities, contacts } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const days: Array<{ date: Date | null; activities: typeof activities }> = [];

    // Padding
    for (let i = 0; i < startPad; i++) days.push({ date: null, activities: [] });

    // Actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const dayActivities = activities.filter(a => a.dueDate?.startsWith(dateStr));
      days.push({ date, activities: dayActivities });
    }
    return days;
  }, [activities, year, month]);

  const today = new Date();
  const isToday = (d: Date | null) => d && d.toDateString() === today.toDateString();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToday = () => setCurrentMonth(new Date());

  const contactName = (id?: string) => id ? contacts.find(c => c.id === id)?.name || '' : '';

  const monthLabel = currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Calendario</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vista mensual de actividades</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goToday} className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
            Hoy
          </button>
          <span className="text-lg font-semibold text-gray-800 dark:text-white capitalize min-w-[200px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className={`min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700/50 p-1.5 transition-colors ${
                day.date ? 'hover:bg-gray-50 dark:hover:bg-gray-700/30' : 'bg-gray-50/50 dark:bg-gray-800/50'
              } ${isToday(day.date) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
            >
              {day.date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isToday(day.date) ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {day.activities.slice(0, 3).map(a => (
                      <div
                        key={a.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate text-white ${TYPE_COLORS[a.type]} ${a.completed ? 'opacity-50 line-through' : ''}`}
                        title={`${ACTIVITY_TYPE_LABELS[a.type]}: ${a.title}${a.contactId ? ` — ${contactName(a.contactId)}` : ''}`}
                      >
                        {a.title}
                      </div>
                    ))}
                    {day.activities.length > 3 && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">+{day.activities.length - 3} más</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
