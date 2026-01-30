
import React, { useState } from 'react';
import { GameProject } from '../types';

interface DashboardProps {
  projects: GameProject[];
  onCreate: (title: string, genre: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const RECOMMENDED_GENRES = [
  "RPG", "Экшен", "Приключение", "Стратегия", "Симулятор", 
  "Пазл", "Хоррор", "Рогалик", "Платформер", "ММО", 
  "Песочница", "Souls-like", "Киберпанк", "Фэнтези", "Выживание"
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
    const completed = project.tasks.filter(t => t.status === 'done' || t.status === 'Готово').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  return (
    <div className="flex h-screen bg-unity-dark text-unity-text overflow-hidden">
      {/* Sidebar - Unity Hub style */}
      <aside className="w-64 bg-unity-panel border-r border-unity-border flex flex-col">
        <div className="p-6 border-b border-unity-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-unity-accent rounded flex items-center justify-center text-white shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/></svg>
            </div>
            <span className="font-bold text-sm tracking-tight">Unity Architect</span>
          </div>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          <button className="w-full text-left px-4 py-2 rounded bg-unity-accent/20 text-unity-accent text-xs font-bold border border-unity-accent/20">
            Проекты
          </button>
          <button className="w-full text-left px-4 py-2 rounded text-unity-dim hover:bg-unity-hover text-xs font-medium transition-colors">
            Обучение
          </button>
          <button className="w-full text-left px-4 py-2 rounded text-unity-dim hover:bg-unity-hover text-xs font-medium transition-colors">
            Сообщество
          </button>
          <button className="w-full text-left px-4 py-2 rounded text-unity-dim hover:bg-unity-hover text-xs font-medium transition-colors">
            Установки
          </button>
        </nav>

        <div className="p-4 border-t border-unity-border">
          <div className="bg-unity-dark/50 p-3 rounded border border-unity-stroke">
            <p className="text-[10px] text-unity-dim font-bold uppercase mb-1">Версия Hub</p>
            <p className="text-[10px] font-mono">v3.8.0-production</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-unity-header border-b border-unity-border flex items-center justify-between px-8">
          <h2 className="text-xl font-bold tracking-tight">Проекты</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Поиск проектов..." 
                className="unity-input w-64 bg-unity-dark border-unity-stroke"
              />
            </div>
            <button 
              onClick={() => setShowCreate(true)}
              className="unity-button-primary px-4 py-1.5 text-xs uppercase font-bold tracking-wider"
            >
              Новый проект
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-unity-dim uppercase tracking-widest border-b border-unity-border">
                  <th className="pb-4 font-bold">Название проекта</th>
                  <th className="pb-4 font-bold">Версия Unity</th>
                  <th className="pb-4 font-bold">Платформа</th>
                  <th className="pb-4 font-bold">Изменен</th>
                  <th className="pb-4 font-bold">Прогресс</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-unity-border/50">
                {projects.map((project) => (
                  <tr 
                    key={project.id}
                    onClick={() => onSelect(project.id)}
                    className="group hover:bg-unity-hover/50 cursor-pointer transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-unity-panel border border-unity-stroke rounded flex items-center justify-center text-unity-dim group-hover:text-unity-accent transition-colors">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/></svg>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-unity-text">{project.title}</div>
                          <div className="text-[10px] text-unity-dim">{project.genre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-mono text-unity-dim">2023.2.14f1</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <span className="w-5 h-5 bg-unity-panel border border-unity-stroke rounded flex items-center justify-center text-[8px] font-bold">PC</span>
                        <span className="w-5 h-5 bg-unity-panel border border-unity-stroke rounded flex items-center justify-center text-[8px] font-bold">WEB</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-unity-dim">
                      {new Date(project.lastModified).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-4">
                      <div className="w-32">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-bold">{calculateProgress(project)}%</span>
                        </div>
                        <div className="h-1 bg-unity-dark rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-unity-accent transition-all duration-500"
                            style={{ width: `${calculateProgress(project)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm('Удалить проект?')) onDelete(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-unity-dim hover:text-rose-500 transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {projects.length === 0 && !showCreate && (
              <div className="mt-20 text-center py-20 border-2 border-dashed border-unity-border rounded-lg bg-unity-panel/30">
                <div className="w-16 h-16 bg-unity-dark border border-unity-stroke rounded-full flex items-center justify-center mx-auto mb-6 text-unity-dim">
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/></svg>
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">Проекты не найдены</h3>
                <p className="text-unity-dim text-sm mb-6">Создайте свой первый дизайн-документ, чтобы начать разработку.</p>
                <button 
                  onClick={() => setShowCreate(true)}
                  className="unity-button-primary px-6 py-2 text-xs font-bold uppercase tracking-widest"
                >
                  Создать новый проект
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal - Hub Style */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="bg-unity-panel border border-unity-stroke w-full max-w-lg rounded-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-unity-header px-6 py-4 border-b border-unity-border flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest">Новый проект</h3>
              <button onClick={() => setShowCreate(false)} className="text-unity-dim hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="inspector-label ml-1">Название проекта</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="unity-input w-full py-2.5 text-sm font-medium"
                  placeholder="Название вашей игры"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="inspector-label ml-1">Жанр / Шаблон</label>
                <input 
                  type="text" 
                  list="genre-suggestions"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="unity-input w-full py-2.5 text-sm font-medium"
                  placeholder="Например: RPG"
                  required
                />
                <datalist id="genre-suggestions">
                  {RECOMMENDED_GENRES.map(g => <option key={g} value={g} />)}
                </datalist>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="unity-button px-6 py-2"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="unity-button-primary px-6 py-2"
                >
                  Создать
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
