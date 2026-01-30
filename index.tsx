import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
interface SubSection { id: string; title: string; content: string; isExpanded: boolean; }
interface Section { id: string; title: string; content: string; notes?: string; attachments?: string[]; suggestions?: string[]; subSections?: SubSection[]; }
type TaskPriority = 'urgent' | 'normal' | 'low';
interface ChecklistItem { id: string; text: string; completed: boolean; }
interface Task { id: string; title: string; description: string; status: string; priority: TaskPriority; progress: number; checklist: ChecklistItem[]; }
interface BoardColumn { id: string; title: string; color: string; }
interface GameProject { id: string; title: string; genre: string; lastModified: number; timeSpent: number; hourlyRate: number; sections: Section[]; tasks: Task[]; columns: BoardColumn[]; }

// --- CONSTANTS ---
const SYSTEM_INSTRUCTION = `Вы — ведущий технический геймдизайнер и эксперт по Unity 3D (C#). Помогайте проектировать игры для Unity.`;
const DEFAULT_GDD_SECTIONS: Section[] = [
  { id: 'concept', title: 'Концепция проекта', content: 'Основное видение игры.', suggestions: ['Платформа', 'Unity версия'] },
  { id: 'mechanics', title: 'Игровые системы', content: 'Механики взаимодействия.', suggestions: ['Controller', 'AI'] }
];

// --- SERVICES ---
const getGeminiResponse = async (prompt: string, context: string = "") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context ? `Контекст: ${context}\n\nЗадача: ${prompt}` : prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 }
    });
    return response.text || "Нет ответа";
  } catch (e) { return "Ошибка ИИ"; }
};

// --- COMPONENTS ---

const Dashboard = ({ projects, onCreate, onDelete, onSelect }: any) => {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('RPG');

  return (
    <div className="flex h-screen bg-unity-dark text-unity-text p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">Arcane Hub</h1>
          <button onClick={() => setShowCreate(true)} className="unity-button-primary px-6 py-2 uppercase font-bold text-xs tracking-widest">Новый Проект</button>
        </div>
        
        <div className="grid gap-4">
          {projects.map((p: any) => (
            <div key={p.id} onClick={() => onSelect(p.id)} className="bg-unity-panel border border-unity-stroke p-6 rounded cursor-pointer hover:border-unity-accent transition-all flex justify-between items-center group">
              <div>
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="text-unity-dim text-xs uppercase">{p.genre} • {new Date(p.lastModified).toLocaleDateString()}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:scale-110 transition-all">Удалить</button>
            </div>
          ))}
          {projects.length === 0 && <p className="text-center text-unity-dim py-20 border-2 border-dashed border-unity-stroke rounded">Нет активных проектов</p>}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
            <div className="bg-unity-panel border border-unity-stroke p-8 rounded-sm w-full max-w-md">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-widest">Создание игры</h2>
              <div className="space-y-4">
                <input className="unity-input w-full py-2" placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} />
                <input className="unity-input w-full py-2" placeholder="Жанр" value={genre} onChange={e => setGenre(e.target.value)} />
                <div className="flex gap-2 pt-4">
                  <button onClick={() => setShowCreate(false)} className="unity-button flex-1">Отмена</button>
                  <button onClick={() => { onCreate(title, genre); setShowCreate(false); }} className="unity-button-primary flex-1">Создать</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Editor = ({ project, onUpdate, onExit }: any) => {
  const [activeSectionId, setActiveSectionId] = useState(project.sections[0]?.id);
  const activeSection = project.sections.find((s: any) => s.id === activeSectionId);

  const updateSection = (content: string) => {
    onUpdate({
      ...project,
      sections: project.sections.map((s: any) => s.id === activeSectionId ? { ...s, content } : s)
    });
  };

  return (
    <div className="flex h-screen bg-unity-dark overflow-hidden">
      <aside className="w-64 bg-unity-panel border-r border-unity-border flex flex-col">
        <div className="p-4 border-b border-unity-border bg-unity-header flex justify-between items-center">
           <span className="text-[10px] font-bold text-unity-dim uppercase">Иерархия</span>
           <button onClick={onExit} className="text-[10px] text-rose-500 font-bold hover:underline">ВЫХОД</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {project.sections.map((s: any) => (
            <button 
              key={s.id} 
              onClick={() => setActiveSectionId(s.id)}
              className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${activeSectionId === s.id ? 'bg-unity-accent text-white' : 'text-unity-dim hover:bg-unity-hover'}`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-unity-dark">
        <header className="h-10 bg-unity-header border-b border-unity-border flex items-center px-4">
          <span className="text-[11px] font-bold text-white uppercase tracking-widest">{activeSection?.title}</span>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-unity-panel border border-unity-stroke p-8 rounded-sm shadow-2xl min-h-full">
            <textarea 
              className="w-full h-[60vh] bg-transparent border-none outline-none resize-none text-unity-text leading-relaxed font-medium"
              value={activeSection?.content}
              onChange={e => updateSection(e.target.value)}
              placeholder="Начните проектирование здесь..."
            />
          </div>
        </div>
      </main>

      <aside className="w-[350px] bg-unity-panel border-l border-unity-border p-4 flex flex-col">
        <div className="text-[10px] font-bold text-unity-dim uppercase mb-4 tracking-widest">Инспектор ИИ</div>
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
           <div className="p-3 bg-unity-dark border border-unity-stroke rounded text-xs text-unity-dim leading-relaxed">
             Я помогу тебе проработать этот раздел. Напиши, что именно тебя интересует в дизайне {project.title}.
           </div>
        </div>
        <div className="mt-4">
          <textarea className="unity-input w-full h-20 text-xs" placeholder="Спросить ИИ..." />
          <button className="unity-button-primary w-full mt-2 py-2 text-[10px] font-bold uppercase">Анализ</button>
        </div>
      </aside>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App = () => {
  const [projects, setProjects] = useState<GameProject[]>(() => {
    const saved = localStorage.getItem('arcane_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('arcane_v1', JSON.stringify(projects));
  }, [projects]);

  const createProject = (title: string, genre: string) => {
    const newProject: GameProject = {
      id: crypto.randomUUID(), title, genre, lastModified: Date.now(), timeSpent: 0, hourlyRate: 20,
      sections: JSON.parse(JSON.stringify(DEFAULT_GDD_SECTIONS)),
      tasks: [], columns: []
    };
    setProjects([newProject, ...projects]);
    setCurrentId(newProject.id);
  };

  const updateProject = (updated: GameProject) => {
    setProjects(projects.map(p => p.id === updated.id ? { ...updated, lastModified: Date.now() } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const currentProject = projects.find(p => p.id === currentId);

  if (currentProject) {
    return <Editor project={currentProject} onUpdate={updateProject} onExit={() => setCurrentId(null)} />;
  }

  return <Dashboard projects={projects} onCreate={createProject} onDelete={deleteProject} onSelect={setCurrentId} />;
};

// --- BOOTSTRAP ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
(window as any).APP_LOADED = true;
console.log("Arcane Hub: Launched.");
