import React from 'react';
import { Company } from '../types';

interface CompanyFilterProps {
  companies: Company[];
  selectedId: string; // 'all' o company.id
  onChange: (id: string) => void;
  counts?: Record<string, number>; // companyId -> #cotizaciones
  allCount?: number;
  disabled?: boolean;
}

const CompanyFilter: React.FC<CompanyFilterProps> = ({ companies, selectedId, onChange, counts = {}, allCount = 0, disabled }) => {
  const options = [{ id: 'all', name: 'Todas las Empresas' }, ...companies];

  return (
    <div aria-label="Filtro de empresas">
      <label className="block text-sm font-medium text-gray-600 mb-2">Filtrar por Empresa</label>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {options.map(opt => {
          const count = opt.id === 'all' ? allCount : counts[opt.id] || 0;
          const selected = opt.id === selectedId;
          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition shadow-sm flex items-center gap-1
                ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/60 hover:bg-white border-gray-300/60 text-gray-700'}
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {opt.id === 'all' ? 'Todas' : opt.name.split(' ')[0]}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selected ? 'bg-white/30' : 'bg-gray-200/70 text-gray-600'}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyFilter;
