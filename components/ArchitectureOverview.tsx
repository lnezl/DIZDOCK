
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
    link.download = `arcane-db-${project.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
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
        if (imported.id && imported.sections && onFullProjectImport) {
          onFullProjectImport(imported);
          alert('База данных проекта успешно загружена!');
        } else {
          alert('Ошибка: Файл имеет неверный формат.');
        }
      } catch (err) {
        alert('Ошибка при чтении файла БД. Убедитесь, что это корректный JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Архитектура</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Экономика проекта и управление данными</p>
        </div>
        
        <div className="flex gap-8 items-center bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <div className="text-right">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Время разработки</span>
             <span className="text-2xl font-black text-emerald-500 font-mono">{totalHours.toFixed(1)} ч.</span>
          </div>
          <div className="text-right border-l border-slate-800 pl-8">
             <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-1">Текущий бюджет</span>
             <span className="text-2xl font-black text-primary-400 font-mono">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Модуль Базы Данных */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-[3rem] p-10 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="mb-8">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <h3 className="text-xl font-black text-white mb-2">Управление Данными</h3>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-relaxed">
              Экспортируйте данные в JSON для резервного копирования или переноса проекта между устройствами.
            </p>
          </div>
          <div className="flex gap-2 relative z-10">
            <button 
              onClick={handleExportDB}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              Экспорт БД
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-4 rounded-2xl text-[10px] uppercase transition-all active:scale-95"
            >
              Импорт БД
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportDB} />
          </div>
        </div>

        {/* Прочие модули разделов */}
        {project.sections.map(section => (
          <button 
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className="group relative bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem] text-left hover:border-primary-500/50 transition-all transform hover:-translate-y-2 shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-8 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300 border border-primary-500/10">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 className="text-xl font-black text-white mb-2 group-hover:text-primary-400 transition-colors">{section.title}</h3>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${(section.subSections || []).length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
              {(section.subSections || []).length} объектов
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArchitectureOverview;
