
import React, { useState } from 'react';
import { GameProject } from '../types';

interface DashboardProps {
  projects: GameProject[];
  onCreate: (title: string, genre: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const RECOMMENDED_GENRES = [
  "RPG", "Action", "Adventure", "Strategy", "Simulation", 
  "Puzzle", "Horror", "Roguelike", "Platformer", "MMO", 
  "Sandbox", "Souls-like", "Cyberpunk", "Fantasy", "Survival"
];

const Dashboard: React.FC<DashboardProps> = ({ projects, onCreate, onDelete, onSelect }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && genre) {
      onCreate(title, genre);
      setTitle('');
      setGenre('');
      setShowCreate(false);
    }
  };

  const calculateProgress = (project: GameProject) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.status === 'done').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  return (
    <div className="p-8 lg:p-16 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
        <div className="max-w-2xl">
          <h2 className="text-6xl font-black mb-4 tracking-tighter text-white">Лаборатория</h2>
          <p className="text-slate-400 font-medium text-xl leading-relaxed">Добро пожаловать в Forge. Место, где абстрактные идеи превращаются в детальные миры и механики.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary-600/20 hover:scale-105 active:scale-95 group flex items-center gap-3"
        >
          <span>Новый Проект</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {projects.map((project) => (
          <div 
            key={project.id}
            className="group bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 hover:border-primary-500/50 transition-all cursor-pointer relative overflow-hidden flex flex-col min-h-[340px] shadow-xl hover:shadow-primary-500/5 hover:-translate-y-2"
            onClick={() => onSelect(project.id)}
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="text-slate-600 hover:text-rose-500 p-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
            
            <div className="mb-8 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 bg-primary-400/5 px-5 py-2 rounded-full border border-primary-500/20">
                {project.genre}
              </span>
            </div>
            
            <h3 className="text-3xl font-black mb-auto group-hover:text-primary-300 transition-colors leading-tight tracking-tight">{project.title}</h3>
            
            <div className="mt-10 space-y-5">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                <span>Прогресс GDD</span>
                <span className="text-primary-400 font-mono text-sm">{calculateProgress(project)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-[2px]">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                  style={{ width: `${calculateProgress(project)}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-4">
                 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  {new Date(project.lastModified).toLocaleDateString()}
                </p>
                <div className="flex -space-x-3">
                   {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-primary-500/50 rounded-full" />
                      </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && !showCreate && (
          <div className="col-span-full py-40 text-center border-4 border-dashed border-slate-800 rounded-[4rem] flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm">
            <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mb-10 text-primary-500 border border-primary-500/20 shadow-2xl shadow-primary-500/10">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <p className="text-slate-400 text-2xl font-black mb-8 max-w-md leading-relaxed">Ни одного мира еще не создано. Станьте первым Архитектором.</p>
            <button 
              onClick={() => setShowCreate(true)}
              className="text-primary-400 hover:text-white font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 bg-primary-500/10 px-8 py-4 rounded-[1.5rem] border border-primary-500/20 hover:bg-primary-600 transition-all active:scale-95"
            >
              Создать GDD <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[4rem] p-12 shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px]" />
            <h3 className="text-4xl font-black mb-12 text-center tracking-tighter text-white relative z-10">Проектирование</h3>
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Название Проекта</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-[2rem] px-8 py-5 outline-none focus:border-primary-500 transition-all text-white text-xl font-bold placeholder-slate-800"
                  placeholder="The Eternal Forge"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Жанр / Сеттинг</label>
                <input 
                  type="text" 
                  list="genre-suggestions"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-[2rem] px-8 py-5 outline-none focus:border-primary-500 transition-all text-white text-xl font-bold placeholder-slate-800"
                  placeholder="Sci-Fi Souls-like"
                  required
                />
                <datalist id="genre-suggestions">
                  {RECOMMENDED_GENRES.map(g => <option key={g} value={g} />)}
                </datalist>
              </div>
              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-5 rounded-[2rem] transition-all uppercase tracking-widest text-xs"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-black py-5 rounded-[2rem] transition-all shadow-2xl shadow-primary-600/20 uppercase tracking-widest text-xs"
                >
                  Инициализация
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
