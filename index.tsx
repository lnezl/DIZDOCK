
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- ТИПЫ ДАННЫХ ---
interface SubSection { id: string; title: string; content: string; isExpanded: boolean; }
interface Section { id: string; title: string; content: string; suggestions?: string[]; subSections?: SubSection[]; attachments?: string[]; notes?: string; }
interface Task { id: string; title: string; status: string; priority: 'urgent'|'normal'|'low'; progress: number; checklist: {id:string; text:string; completed:boolean}[]; }
interface PlotNode { id: string; title: string; content: string; position: {x:number; y:number}; choices: {id:string; text:string; targetNodeId:string|null}[]; }
interface StoryFlow { id: string; name: string; plotNodes: PlotNode[]; }
interface GameProject { id: string; title: string; genre: string; lastModified: number; sections: Section[]; tasks: Task[]; columns: {id:string; title:string; color:string}[]; storyFlows: StoryFlow[]; }

// --- КОНСТАНТЫ ---
const SYSTEM_INSTRUCTION = `Вы — эксперт по Unity (C#) и геймдизайну. Помогайте пользователю проектировать игры.`;
const DEFAULT_SECTIONS: Section[] = [
  { id: 'concept', title: 'Концепция', content: 'Основная идея игры.', suggestions: ['Платформа', 'Цель'] },
  { id: 'mechanics', title: 'Механики', content: 'Описание игрового процесса.', suggestions: ['Управление', 'Боевка'] }
];
const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'План', color: 'bg-sky-500' },
  { id: 'doing', title: 'В работе', color: 'bg-unity-accent' },
  { id: 'done', title: 'Готово', color: 'bg-emerald-500' }
];

// --- ИИ СЕРВИС ---
const askAI = async (prompt: string, context: string = "") => {
  // Use the API key directly from process.env.API_KEY as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context ? `Контекст: ${context}\n\nЗадача: ${prompt}` : prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 }
    });
    // Use .text property directly to get the response string.
    return res.text || "Нет ответа";
  } catch (e) { return "Ошибка API"; }
};

// --- КОМПОНЕНТЫ ---

// 1. STORY FLOW (Нодовый редактор)
const StoryFlowEditor = ({ project, flowId, onUpdate }: any) => {
  const flow = project.storyFlows.find((f:any) => f.id === flowId);
  const [nodes, setNodes] = useState<PlotNode[]>(flow?.plotNodes || []);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({x:0, y:0});

  const addNode = () => {
    const newNode: PlotNode = { id: crypto.randomUUID(), title: 'Новая сцена', content: '', position: {x: 100, y: 100}, choices: [] };
    const updated = [...nodes, newNode];
    setNodes(updated);
    save(updated);
  };

  const save = (newNodes: PlotNode[]) => {
    onUpdate({ ...project, storyFlows: project.storyFlows.map((f:any) => f.id === flowId ? {...f, plotNodes: newNodes} : f)});
  };

  return (
    <div className="h-full bg-slate-950 rounded-lg relative overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-xs font-bold uppercase tracking-widest text-unity-accent">Story Canvas: {flow?.name}</h3>
        <button onClick={addNode} className="unity-button-primary px-4 py-1 text-[10px] font-bold">ADD NODE</button>
      </div>
      <div className="flex-1 relative overflow-auto bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]">
        {nodes.map(node => (
          <div 
            key={node.id}
            style={{ left: node.position.x, top: node.position.y }}
            className="absolute w-48 bg-unity-panel border border-unity-stroke p-3 rounded shadow-xl cursor-move"
            onMouseDown={(e) => { setDragging(node.id); setOffset({x: e.clientX - node.position.x, y: e.clientY - node.position.y}); }}
          >
            <input 
              className="bg-transparent text-[10px] font-bold text-white w-full outline-none mb-2" 
              value={node.title} 
              onChange={e => {
                const updated = nodes.map(n => n.id === node.id ? {...n, title: e.target.value} : n);
                setNodes(updated); save(updated);
              }}
            />
            <textarea 
              className="w-full bg-unity-dark text-[9px] p-1 h-12 outline-none rounded border border-unity-stroke"
              value={node.content}
              onChange={e => {
                const updated = nodes.map(n => n.id === node.id ? {...n, content: e.target.value} : n);
                setNodes(updated); save(updated);
              }}
              placeholder="Событие..."
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. KANBAN (Доска задач)
const KanbanBoard = ({ project, onUpdate }: any) => {
  const addTask = (colId: string) => {
    const title = prompt('Название задачи:');
    if (!title) return;
    onUpdate({ ...project, tasks: [...project.tasks, { id: crypto.randomUUID(), title, status: colId, priority: 'normal', progress: 0, checklist: [] }]});
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex gap-4 h-full overflow-x-auto p-4">
          {project.columns.map((col: any) => (
            <div key={col.id} className="w-72 bg-unity-panel border border-unity-stroke flex flex-col rounded p-2">
               <div className="flex justify-between items-center mb-4 px-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-unity-dim">{col.title}</span>
                 <button onClick={() => addTask(col.id)} className="text-unity-accent text-lg">+</button>
               </div>
               <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                  {project.tasks.filter((t:any) => t.status === col.id).map((task:any) => (
                    <div key={task.id} className="bg-unity-dark p-3 border border-unity-stroke rounded hover:border-unity-accent transition-colors">
                       <p className="text-xs font-medium">{task.title}</p>
                    </div>
                  ))}
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

// 3. UNITY TOOLKIT (Генератор кода)
const UnityToolkit = ({ project }: any) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const result = await askAI("Сгенерируй C# класс ScriptableObject для системы инвентаря на Unity. Только код.");
    setCode(result);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-6">
       <button onClick={generate} disabled={loading} className="unity-button-primary py-2 px-6 self-start text-xs font-bold uppercase mb-4">
         {loading ? "Генерация..." : "Генерация C# Архитектуры"}
       </button>
       <div className="flex-1 bg-black rounded p-4 font-mono text-xs overflow-auto text-emerald-400 border border-emerald-900/30">
          <pre>{code || "// Выберите раздел для генерации кода..."}</pre>
       </div>
    </div>
  );
};

// 4. MAIN EDITOR
const MainEditor = ({ project, onUpdate, onExit }: any) => {
  const [view, setView] = useState('concept');
  const [aiQuery, setAiQuery] = useState('');
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const activeSection = project.sections.find((s:any) => s.id === view);

  const runAI = async () => {
    if (!aiQuery.trim()) return;
    setLoadingAI(true);
    const res = await askAI(aiQuery, `Проект: ${project.title}. Раздел: ${view}`);
    setAiHistory([...aiHistory, { q: aiQuery, a: res }]);
    setAiQuery('');
    setLoadingAI(false);
  };

  return (
    <div className="flex h-screen bg-unity-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-unity-panel border-r border-unity-border flex flex-col shrink-0">
        <div className="p-4 bg-unity-header border-b border-unity-border flex justify-between items-center">
          <span className="text-[10px] font-bold text-unity-dim uppercase">Hierarchy</span>
          <button onClick={onExit} className="text-rose-500 text-[10px] font-bold">HUB</button>
        </div>
        <div className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar">
           <div className="text-[9px] font-bold text-unity-dim p-2 uppercase">Assets</div>
           <button onClick={() => setView('kanban')} className={`w-full text-left px-3 py-1.5 rounded text-xs ${view === 'kanban' ? 'bg-unity-accent text-white' : 'text-unity-dim hover:bg-unity-hover'}`}>Board: Tasks</button>
           <button onClick={() => setView('story')} className={`w-full text-left px-3 py-1.5 rounded text-xs ${view === 'story' ? 'bg-unity-accent text-white' : 'text-unity-dim hover:bg-unity-hover'}`}>Canvas: Story</button>
           <button onClick={() => setView('toolkit')} className={`w-full text-left px-3 py-1.5 rounded text-xs ${view === 'toolkit' ? 'bg-unity-accent text-white' : 'text-unity-dim hover:bg-unity-hover'}`}>Tool: C# Generator</button>
           <div className="h-4" />
           <div className="text-[9px] font-bold text-unity-dim p-2 uppercase">GDD Sections</div>
           {project.sections.map((s:any) => (
             <button key={s.id} onClick={() => setView(s.id)} className={`w-full text-left px-3 py-1.5 rounded text-xs ${view === s.id ? 'bg-unity-accent text-white' : 'text-unity-dim hover:bg-unity-hover'}`}>{s.title}</button>
           ))}
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-10 bg-unity-header border-b border-unity-border flex items-center px-4 justify-between">
           <span className="text-[11px] font-bold text-white uppercase tracking-widest">{view.toUpperCase()}</span>
           <div className="flex gap-4">
              <span className="text-[10px] text-unity-dim font-mono">v2.8.5-STABLE</span>
           </div>
        </header>
        <div className="flex-1 p-6 overflow-hidden">
           {view === 'kanban' ? <KanbanBoard project={project} onUpdate={onUpdate} /> :
            view === 'story' ? <StoryFlowEditor project={project} flowId={project.storyFlows[0].id} onUpdate={onUpdate} /> :
            view === 'toolkit' ? <UnityToolkit project={project} /> :
            activeSection ? (
              <div className="h-full bg-unity-panel border border-unity-stroke p-8 rounded-sm shadow-inner flex flex-col">
                 <h2 className="text-xl font-bold mb-4 border-b border-unity-stroke pb-2">{activeSection.title}</h2>
                 <textarea 
                   className="flex-1 bg-transparent border-none outline-none resize-none text-unity-text leading-relaxed font-medium"
                   value={activeSection.content}
                   onChange={e => onUpdate({...project, sections: project.sections.map((s:any) => s.id === view ? {...s, content: e.target.value} : s)})}
                   placeholder="Напишите спецификацию..."
                 />
              </div>
            ) : null}
        </div>
      </main>

      {/* Right AI Sidebar */}
      <aside className="w-80 bg-unity-panel border-l border-unity-border flex flex-col shrink-0">
         <div className="p-3 bg-unity-header border-b border-unity-border">
            <span className="text-[10px] font-bold text-unity-dim uppercase">Arcane AI Assistant</span>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {aiHistory.map((h, i) => (
              <div key={i} className="space-y-2">
                 <div className="bg-unity-accent/10 border border-unity-accent/20 p-2 rounded text-[11px] text-unity-dim">{h.q}</div>
                 <div className="bg-unity-dark p-3 border border-unity-stroke rounded text-[11px] leading-relaxed select-text">{h.a}</div>
              </div>
            ))}
            {loadingAI && <div className="text-[10px] animate-pulse text-unity-accent">ИИ анализирует...</div>}
         </div>
         <div className="p-4 border-t border-unity-border bg-unity-dark">
            <textarea 
              className="unity-input w-full h-20 text-[11px] mb-2 resize-none"
              placeholder="Спроси о геймдизайне или коде..."
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), runAI())}
            />
            <button onClick={runAI} className="unity-button-primary w-full py-2 text-[10px] font-bold uppercase">АНАЛИЗ</button>
         </div>
      </aside>
    </div>
  );
};

// 5. DASHBOARD
const Dashboard = ({ projects, onCreate, onDelete, onSelect }: any) => {
  const [show, setShow] = useState(false);
  const [t, setT] = useState('');
  return (
    <div className="flex h-screen bg-unity-dark p-12">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black text-white tracking-tighter">Arcane <span className="text-unity-accent">Unity Hub</span></h1>
          <button onClick={() => setShow(true)} className="unity-button-primary px-8 py-2 font-bold text-xs uppercase tracking-widest">Новый проект</button>
        </div>
        <div className="grid gap-4">
          {projects.map((p: any) => (
            <div key={p.id} onClick={() => onSelect(p.id)} className="bg-unity-panel border border-unity-stroke p-6 rounded cursor-pointer hover:border-unity-accent flex justify-between items-center group">
              <div>
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="text-[10px] text-unity-dim uppercase font-bold mt-1">{p.genre} • {new Date(p.lastModified).toLocaleDateString()}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="opacity-0 group-hover:opacity-100 text-rose-500 text-xs font-bold uppercase">Удалить</button>
            </div>
          ))}
          {projects.length === 0 && <div className="text-center py-20 border-2 border-dashed border-unity-stroke rounded text-unity-dim">У вас пока нет активных разработок.</div>}
        </div>
        {show && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
            <div className="bg-unity-panel border border-unity-stroke p-8 rounded w-full max-w-md">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-widest text-unity-accent">Инициализация GDD</h2>
              <input className="unity-input w-full py-3 mb-4" placeholder="Название игры..." value={t} onChange={e => setT(e.target.value)} autoFocus />
              <div className="flex gap-2">
                 <button onClick={() => setShow(false)} className="unity-input flex-1">Отмена</button>
                 <button onClick={() => { onCreate(t, 'RPG'); setShow(false); setT(''); }} className="unity-button-primary flex-1 font-bold">СОЗДАТЬ</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- CORE APP ---
const App = () => {
  const [projects, setProjects] = useState<GameProject[]>(() => {
    const saved = localStorage.getItem('arcane_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [cur, setCur] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('arcane_v2', JSON.stringify(projects)); }, [projects]);

  const create = (title: string, genre: string) => {
    const p: GameProject = {
      id: crypto.randomUUID(), title, genre, lastModified: Date.now(),
      sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)),
      tasks: [], columns: JSON.parse(JSON.stringify(DEFAULT_COLUMNS)),
      storyFlows: [{ id: crypto.randomUUID(), name: 'Основной квест', plotNodes: [] }]
    };
    setProjects([p, ...projects]);
    setCur(p.id);
  };

  const current = projects.find(p => p.id === cur);

  if (current) return <MainEditor project={current} onExit={() => setCur(null)} onUpdate={(p:any) => setProjects(projects.map(item => item.id === p.id ? {...p, lastModified: Date.now()} : item))} />;

  return <Dashboard projects={projects} onCreate={create} onDelete={(id:string) => setProjects(projects.filter(p => p.id !== id))} onSelect={setCur} />;
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
// Using type assertion to any to fix TS error: Property 'APP_LOADED' does not exist on type 'Window'.
(window as any).APP_LOADED = true;
