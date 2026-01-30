
import React, { useState, useRef } from 'react';
import { GameProject } from '../types';

interface ArchitectureOverviewProps {
  project: GameProject;
  onNavigate: (viewId: string) => void;
  onUpdateRate: (rate: number) => void;
  onUpdateAuth: (login: string, pass: string) => void;
  authData: { login: string, pass: string };
  onFullProjectImport?: (project: GameProject) => void;
}

const ArchitectureOverview: React.FC<ArchitectureOverviewProps> = ({ 
  project, onNavigate, onUpdateRate, onUpdateAuth, authData, onFullProjectImport 
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(project.hourlyRate.toString());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalHours = project.timeSpent / 3600000;
  const totalCost = totalHours * project.hourlyRate;

  const handleRateSubmit = () => {
    onUpdateRate(parseFloat(rateInput) || 0);
    setIsEditingRate(false);
  };

  const handleExportDB = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arcane-db-${project.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.id && onFullProjectImport) {
          onFullProjectImport(imported);
          alert('База данных успешно загружена!');
        }
      } catch (err) {
        alert('Ошибка при чтении файла БД');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col space-y-12 pb-20">
      <div className="flex justify-between items-end gap-8">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Архитектура</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Экономика и структура данных</p>
        </div>
        
        <div className="flex gap-8 items-center bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />
          <div className="text-right">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Время</span>
             <span className="text-2xl font-black text-emerald-500 font-mono">{totalHours.toFixed(1)} ч.</span>
          </div>
          <div className="text-right border-l border-slate-800 pl-8">
             <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-1">Бюджет</span>
             <span className="text-2xl font-black text-primary-400 font-mono">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* База данных модуль */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-[3rem] p-10 flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-xl font-black text-white mb-2">База Данных</h3>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-relaxed">
              Экспортируйте проект в JSON для сохранения на диске или переноса на хостинг.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportDB}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-2xl text-[10px] uppercase transition-all"
            >
              Экспорт БД
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-3 rounded-2xl text-[10px] uppercase transition-all"
            >
              Импорт БД
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportDB} />
          </div>
        </div>

        {/* Прочие модули */}
        {project.sections.map(section => (
          <button 
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className="group bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] text-left hover:border-primary-500/50 transition-all shadow-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:bg-primary-500 group-hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 className="text-lg font-black text-white mb-1 group-hover:text-primary-400 transition-colors">{section.title}</h3>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              {(section.subSections || []).length} записей лора
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArchitectureOverview;
