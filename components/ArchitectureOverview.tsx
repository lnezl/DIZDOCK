
import React, { useState } from 'react';
import { GameProject } from '../types';

interface ArchitectureOverviewProps {
  project: GameProject;
  onNavigate: (viewId: string) => void;
  onUpdateRate: (rate: number) => void;
}

const ArchitectureOverview: React.FC<ArchitectureOverviewProps> = ({ project, onNavigate, onUpdateRate }) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(project.hourlyRate.toString());

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(x => x.length > 0).length;

  const msToHours = (ms: number) => ms / 3600000;
  const totalHours = msToHours(project.timeSpent);
  const totalCost = totalHours * project.hourlyRate;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(val);
  };

  const handleRateSubmit = () => {
    onUpdateRate(parseFloat(rateInput) || 0);
    setIsEditingRate(false);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-5xl font-black text-white tracking-tighter">Карта Архитектуры</h2>
            <div className="text-slate-600">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Экономика и структура вашего проекта</p>
        </div>
        
        <div className="flex flex-wrap gap-8 items-center bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          
          <div className="text-right">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Время работы</span>
             <span className="text-2xl font-black text-emerald-500 font-mono">
               {totalHours.toFixed(1)} ч.
             </span>
          </div>
          
          <div className="text-right min-w-[140px]">
             <div className="flex items-center justify-end gap-2 mb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ставка / час</span>
                <button onClick={() => setIsEditingRate(true)} className="text-primary-500 hover:text-white transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
             </div>
             {isEditingRate ? (
               <div className="flex items-center justify-end gap-2">
                 <input 
                  autoFocus
                  className="w-16 bg-slate-950 border border-primary-500/30 rounded px-2 py-0.5 text-xs text-white outline-none"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  onBlur={handleRateSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleRateSubmit()}
                 />
               </div>
             ) : (
               <span className="text-2xl font-black text-white font-mono">
                 {formatCurrency(project.hourlyRate)}
               </span>
             )}
          </div>

          <div className="text-right border-l border-slate-800 pl-8 mr-4">
             <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-1">Бюджет проекта</span>
             <span className="text-2xl font-black text-primary-400 font-mono">
               {formatCurrency(totalCost)}
             </span>
          </div>

          <button 
            onClick={handleExportPDF}
            className="flex flex-col items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-4 rounded-2xl transition-all shadow-xl shadow-primary-600/20 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Экспорт PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="col-span-full mt-8 mb-4 flex items-center gap-4">
           <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">Текстовые Разделы (GDD)</span>
           <div className="h-px bg-slate-800 flex-1" />
        </div>

        {project.sections.map(section => (
          <button 
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className="group relative bg-slate-900/40 border border-slate-800/80 p-8 rounded-[2.5rem] text-left hover:border-primary-500/50 transition-all hover:-translate-y-1 shadow-xl"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-600 uppercase">{wordCount(section.content)} слов</span>
                <span className="text-[8px] font-bold text-slate-700 uppercase">{section.attachments?.length || 0} референсов</span>
              </div>
            </div>
            <h3 className="text-xl font-black text-white mb-3 group-hover:text-primary-400 transition-colors">{section.title}</h3>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {section.content.length > 20 ? section.content : 'Раздел требует проработки...'}
            </p>
          </button>
        ))}

        <div className="col-span-full mt-12 mb-4 flex items-center gap-4">
           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Инженерная логика</span>
           <div className="h-px bg-slate-800 flex-1" />
        </div>

        {project.storyFlows.map(flow => (
          <button 
            key={flow.id}
            onClick={() => onNavigate(flow.id)}
            className="group relative bg-slate-900/40 border border-slate-800/80 p-8 rounded-[2.5rem] text-left hover:border-indigo-500/50 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase">{flow.plotNodes.length} узлов</span>
            </div>
            <h3 className="text-xl font-black text-white mb-3 group-hover:text-indigo-400 transition-colors">{flow.name}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Схема игровых механик и логических связей.
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArchitectureOverview;
