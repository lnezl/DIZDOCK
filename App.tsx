
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameProject, BoardColumn } from './types.ts';
import { DEFAULT_GDD_SECTIONS } from './constants.ts';
import Dashboard from './components/Dashboard.tsx';
import Editor from './components/Editor.tsx';
import Login from './components/Login.tsx';

const STORAGE_KEY = 'arcane_unity_v1';
const LAST_PROJECT_KEY = 'arcane_last_project_id';
const AUTH_KEY = 'arcane_auth_credentials';

const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: 'backlog', title: 'Бэклог', color: 'bg-slate-700' },
  { id: 'todo', title: 'План', color: 'bg-sky-500' },
  { id: 'doing', title: 'В работе', color: 'bg-primary-500' },
  { id: 'done', title: 'Готово', color: 'bg-emerald-500' }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? JSON.parse(saved) : { login: 'nez', pass: 'nez123' };
  });

  const [projects, setProjects] = useState<GameProject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map((p: any) => ({
        ...p,
        columns: p.columns || DEFAULT_COLUMNS,
        storyFlows: p.storyFlows || [{ id: crypto.randomUUID(), name: 'Основной сюжет', plotNodes: [] }],
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
      hourlyRate: 20,
      sections: [...DEFAULT_GDD_SECTIONS],
      tasks: [],
      columns: [...DEFAULT_COLUMNS],
      storyFlows: [{ id: crypto.randomUUID(), name: 'Основной сюжет', plotNodes: [] }]
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
    <div className="min-h-screen flex flex-col bg-unity-dark">
      <header className="h-10 bg-unity-header border-b border-unity-dark flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentProjectId(null)} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-tighter transition-all flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3"/></svg>
            Хаб Архитектора Unity
          </button>
          <div className="h-4 w-[1px] bg-unity-border mx-2" />
          <h1 className="text-[11px] font-bold text-slate-300">{currentProject.title} <span className="text-slate-500 font-normal">[{currentProject.genre}]</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-slate-500 font-mono">Сборка v2.5.0</span>
          <button onClick={() => setIsAuthenticated(false)} className="text-[9px] font-bold text-rose-500 uppercase hover:text-rose-400">Выход</button>
        </div>
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
