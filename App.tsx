
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameProject, ViewState, StoryFlowData, BoardColumn } from './types';
import { DEFAULT_GDD_SECTIONS } from './constants';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import Login from './components/Login';

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
      return parsed.map((p: any) => {
        let storyFlows = p.storyFlows || [];
        if (storyFlows.length === 0 && p.plotNodes && p.plotNodes.length > 0) {
          storyFlows = [{
            id: 'default-flow',
            name: 'Основной сюжет',
            plotNodes: p.plotNodes
          }];
        } else if (storyFlows.length === 0) {
          storyFlows = [{
            id: crypto.randomUUID(),
            name: 'Основная схема',
            plotNodes: []
          }];
        }

        return { 
          ...p, 
          timeSpent: p.timeSpent || 0,
          hourlyRate: p.hourlyRate || 0,
          columns: p.columns || DEFAULT_COLUMNS,
          storyFlows: storyFlows.map((f: StoryFlowData) => ({
            ...f,
            plotNodes: (f.plotNodes || []).map((n: any) => ({
              ...n,
              choices: (n.choices || []).map((c: any) => ({
                ...c,
                targetNodeId: c.targetNodeId || null
              }))
            }))
          })),
          tasks: p.tasks || [],
          sections: (p.sections || [...DEFAULT_GDD_SECTIONS]).map((s: any) => ({
            ...s,
            attachments: s.attachments || [],
            notes: s.notes || ''
          }))
        };
      });
    } catch (e) {
      console.error("Critical: Error loading projects", e);
      return [];
    }
  });

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem(LAST_PROJECT_KEY);
  });

  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(credentials));
  }, [credentials]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(LAST_PROJECT_KEY, currentProjectId);
    } else {
      localStorage.removeItem(LAST_PROJECT_KEY);
    }
  }, [currentProjectId]);

  // Минутная принудительная синхронизация
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (currentProjectId) {
        setSaveStatus('saving');
        const updatedProjects = projectsRef.current.map(p => 
          p.id === currentProjectId ? { ...p, lastModified: Date.now() } : p
        );
        setProjects(updatedProjects);
        
        setTimeout(() => {
          setSaveStatus('saved');
          setLastSaveTime(new Date().toLocaleTimeString());
        }, 1500);
      }
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [currentProjectId]);

  const handleLogin = (user: string, pass: string) => {
    if (user === credentials.login && pass === credentials.pass) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleUpdateCredentials = (newLogin: string, newPass: string) => {
    setCredentials({ login: newLogin, pass: newPass });
  };

  const handleCreateProject = (title: string, genre: string) => {
    const newProject: GameProject = {
      id: crypto.randomUUID(),
      title,
      genre,
      lastModified: Date.now(),
      timeSpent: 0,
      hourlyRate: 15,
      sections: [...DEFAULT_GDD_SECTIONS],
      tasks: [],
      columns: [...DEFAULT_COLUMNS],
      storyFlows: [{
        id: crypto.randomUUID(),
        name: 'Основная схема',
        plotNodes: []
      }]
    };
    setProjects(prev => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
  };

  const handleUpdateProject = useCallback((updated: GameProject) => {
    setProjects(prev => prev.map(p => 
      p.id === updated.id ? { ...updated, lastModified: Date.now() } : p
    ));
  }, []);

  const handleDeleteProject = (id: string) => {
    if (confirm('Удалить проект навсегда?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProjectId === id) setCurrentProjectId(null);
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const currentProject = projects.find(p => p.id === currentProjectId);

  if (!currentProject) {
    return (
      <Dashboard 
        projects={projects} 
        onCreate={handleCreateProject}
        onDelete={handleDeleteProject}
        onSelect={setCurrentProjectId}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentProjectId(null)}
            className="text-slate-400 hover:text-white transition-all flex items-center gap-2 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
            <span className="text-xs font-black uppercase tracking-widest">Назад</span>
          </button>
          <div className="h-6 w-px bg-slate-800 mx-2" />
          <h1 className="text-xl font-black tracking-tighter text-white">{currentProject.title}</h1>
        </div>

        <div className="flex items-center gap-6">
           {/* Глобальный индикатор сохранения перенесен сюда */}
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 bg-slate-950/40 ${
              saveStatus === 'saving' ? 'border-amber-500/50 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-800 opacity-60'
            }`}>
              <div className={`w-1 h-1 rounded-full ${
                saveStatus === 'saving' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
              }`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                {saveStatus === 'saving' ? 'Syncing' : `Saved ${lastSaveTime.slice(0, 5)}`}
              </span>
           </div>

           <button 
             onClick={() => setIsAuthenticated(false)}
             className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors"
           >
             Выйти
           </button>
           <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest leading-none">Status</span>
              <span className="text-[10px] text-slate-500 font-bold">Arcane Synced</span>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-500 shadow-lg shadow-primary-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
           </div>
        </div>
      </header>
      <Editor 
        project={currentProject} 
        onUpdate={handleUpdateProject} 
        onUpdateAuth={handleUpdateCredentials}
        authData={credentials}
      />
    </div>
  );
};

export default App;
