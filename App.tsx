
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameProject, ViewState, StoryFlowData, BoardColumn } from './types.ts';
import { DEFAULT_GDD_SECTIONS } from './constants.ts';
import Dashboard from './components/Dashboard.tsx';
import Editor from './components/Editor.tsx';
import Login from './components/Login.tsx';

const STORAGE_KEY = 'arcane_projects_v7';
const LAST_PROJECT_KEY = 'arcane_last_project_id';
const AUTH_KEY = 'arcane_auth_credentials';

const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: 'backlog', title: 'Бэклог', color: 'bg-slate-700' },
  { id: 'todo', title: 'В плане', color: 'bg-sky-500' },
  { id: 'doing', title: 'В работе', color: 'bg-primary-500' },
  { id: 'done', title: 'Готово', color: 'bg-emerald-500' }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? JSON.parse(saved) : { login: 'nez', pass: 'nez123' };
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [lastSaveTime, setLastSaveTime] = useState<string>(new Date().toLocaleTimeString());

  const [projects, setProjects] = useState<GameProject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map((p: any) => ({
        ...p,
        columns: p.columns || DEFAULT_COLUMNS,
        storyFlows: p.storyFlows || [{ id: crypto.randomUUID(), name: 'Основная схема', plotNodes: [] }],
        tasks: p.tasks || [],
        sections: (p.sections || [...DEFAULT_GDD_SECTIONS])
      }));
    } catch (e) {
      return [];
    }
  });

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem(LAST_PROJECT_KEY);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const handleLogin = (user: string, pass: string) => {
    if (user === credentials.login && pass === credentials.pass) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleUpdateProject = useCallback((updated: GameProject) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...updated, lastModified: Date.now() } : p));
  }, []);

  const handleCreateProject = (title: string, genre: string) => {
    const newProject: GameProject = {
      id: crypto.randomUUID(),
      title, genre,
      lastModified: Date.now(),
      timeSpent: 0,
      hourlyRate: 15,
      sections: [...DEFAULT_GDD_SECTIONS],
      tasks: [],
      columns: [...DEFAULT_COLUMNS],
      storyFlows: [{ id: crypto.randomUUID(), name: 'Основная схема', plotNodes: [] }]
    };
    setProjects(prev => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const currentProject = projects.find(p => p.id === currentProjectId);

  if (!currentProject) {
    return (
      <Dashboard 
        projects={projects} 
        onCreate={handleCreateProject}
        onDelete={(id) => setProjects(prev => prev.filter(p => p.id !== id))}
        onSelect={setCurrentProjectId}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentProjectId(null)} className="text-slate-400 hover:text-white transition-all flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest">Назад</span>
          </button>
          <h1 className="text-xl font-black tracking-tighter text-white">{currentProject.title}</h1>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-[9px] font-black text-rose-500 uppercase">Выйти</button>
      </header>
      <Editor 
        project={currentProject} 
        onUpdate={handleUpdateProject} 
        onUpdateAuth={(l, p) => setCredentials({login: l, pass: p})}
        authData={credentials}
      />
    </div>
  );
};

export default App;
