
import React, { useState } from 'react';
import { GameProject } from '../types';

interface ArchitectureOverviewProps {
  project: GameProject;
  onNavigate: (viewId: string) => void;
  onUpdateRate: (rate: number) => void;
  onUpdateAuth: (login: string, pass: string) => void;
  authData: { login: string, pass: string };
}

const ArchitectureOverview: React.FC<ArchitectureOverviewProps> = ({ 
  project, onNavigate, onUpdateRate, onUpdateAuth, authData 
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(project.hourlyRate.toString());
  const [isEditingAuth, setIsEditingAuth] = useState(false);
  const [newLogin, setNewLogin] = useState(authData.login);
  const [newPass, setNewPass] = useState(authData.pass);

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(x => x.length > 0).length;
  const msToHours = (ms: number) => ms / 3600000;
  const totalHours = msToHours(project.timeSpent);
  const totalCost = totalHours * project.hourlyRate;
  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(val);

  const handleRateSubmit = () => {
    onUpdateRate(parseFloat(rateInput) || 0);
    setIsEditingRate(false);
  };

  const handleAuthSubmit = () => {
    if (newLogin.trim() && newPass.trim()) {
      onUpdateAuth(newLogin, newPass);
      setIsEditingAuth(false);
      alert('Данные доступа обновлены');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 md:space-y-12 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 md:gap-8">
        <div className="w-full xl:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Архитектура</h2>
            <div className="text-slate-600 hidden md:block">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-widest mt-2">Экономика и структура</p>
        </div>
        
        <div className="w-full flex flex-col md:flex-row flex-wrap gap-4 md:gap-8 items-stretch md:items-center bg-slate-900/50 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 md:w-1 h-full bg-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          
          <div className="flex-1 md:text-right">
             <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Время</span>
             <span className="text-xl md:text-2xl font-black text-emerald-500 font-mono">{totalHours.toFixed(1)} ч.</span>
          </div>
          
          <div className="flex-1 md:text-right min-w-[120px]">
             <div className="flex items-center md:justify-end gap-2 mb-1">
                <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">Ставка</span>
                <button onClick={() => setIsEditingRate(true)} className="text-primary-500 transition-colors hover:text-primary-400"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
             </div>
             {isEditingRate ? (
               <input autoFocus className="w-full md:w-20 bg-slate-950 border border-primary-500/30 rounded px-2 py-1 text-xs text-white" value={rateInput} onChange={(e) => setRateInput(e.target.value)} onBlur={handleRateSubmit} onKeyDown={(e) => e.key === 'Enter' && handleRateSubmit()} />
             ) : (
               <span className="text-xl md:text-2xl font-black text-white font-mono">{formatCurrency(project.hourlyRate)}</span>
             )}
          </div>

          <div className="flex-1 md:text-right md:border-l border-slate-800 md:pl-8">
             <span className="text-[9px] md:text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-1">Бюджет</span>
             <span className="text-xl md:text-2xl font-black text-primary-400 font-mono">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="col-span-full bg-slate-900/30 border border-slate-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-white">Безопасность</h3>
                <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Управление ключом Forge</p>
              </div>
            </div>
            {isEditingAuth ? (
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <input className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white" value={newLogin} onChange={(e) => setNewLogin(e.target.value)} />
                <input type="password" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                <button onClick={handleAuthSubmit} className="bg-primary-600 p-2 rounded-xl text-white hover:bg-primary-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></button>
              </div>
            ) : (
              <button onClick={() => setIsEditingAuth(true)} className="w-full md:w-auto px-6 py-3 bg-slate-800 text-slate-400 rounded-2xl text-[9px] font-black uppercase hover:bg-slate-700 transition-colors">Изменить доступ</button>
            )}
          </div>
        </div>

        <div className="col-span-full mt-4 flex items-center gap-4">
           <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">GDD РАЗДЕЛЫ</span>
           <div className="h-px bg-slate-800 flex-1" />
        </div>

        {project.sections.map(section => (
          <button 
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className="group relative bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-[2rem] text-left hover:border-primary-500/50 transition-all transform duration-300 hover:scale-[1.02] shadow-xl"
          >
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="text-[8px] font-black text-slate-600 uppercase">{wordCount(section.content)} слов</div>
            </div>
            <h3 className="text-lg font-black text-white mb-2 group-hover:text-primary-400 transition-colors">{section.title}</h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{section.content.slice(0, 50)}...</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArchitectureOverview;
