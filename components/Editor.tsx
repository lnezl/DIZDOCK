
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { GameProject, Section, StoryFlowData, PlotNode } from '../types';
import SectionContent from './SectionContent';
import AIAssistant from './AIAssistant';
import KanbanBoard from './KanbanBoard';
import StoryFlow from './StoryFlow';
import ArchitectureOverview from './ArchitectureOverview';

interface EditorProps {
  project: GameProject;
  onUpdate: (project: GameProject) => void;
}

const Editor: React.FC<EditorProps> = ({ project, onUpdate }) => {
  const [activeView, setActiveView] = useState<string>('architecture-overview-id');
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  
  const projectRef = useRef(project);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        onUpdate({
          ...projectRef.current,
          timeSpent: projectRef.current.timeSpent + 1000,
          lastModified: Date.now()
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, onUpdate]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isBoardActive = activeView === 'kanban-board-special-id';
  const isArchitectureActive = activeView === 'architecture-overview-id';
  const activeFlow = project.storyFlows.find(f => f.id === activeView);
  const activeSection = project.sections.find(s => s.id === activeView);

  const handleUpdateSection = useCallback((id: string, updates: Partial<Section>) => {
    const updatedSections = projectRef.current.sections.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    onUpdate({ ...projectRef.current, sections: updatedSections });
  }, [onUpdate]);

  const handleCreateFlow = () => {
    const newFlow: StoryFlowData = { id: crypto.randomUUID(), name: 'Новая схема', plotNodes: [] };
    onUpdate({ ...projectRef.current, storyFlows: [...projectRef.current.storyFlows, newFlow] });
    setActiveView(newFlow.id);
  };

  const handleExportToFlow = useCallback((flowId: string) => {
    if (!activeSection) return;

    const newNode: PlotNode = {
      id: crypto.randomUUID(),
      title: activeSection.title,
      type: 'scene',
      content: activeSection.content,
      choices: [],
      position: { x: 100, y: 100 },
      color: 'indigo'
    };

    const updatedFlows = projectRef.current.storyFlows.map(f => 
      f.id === flowId ? { ...f, plotNodes: [...f.plotNodes, newNode] } : f
    );

    onUpdate({ ...projectRef.current, storyFlows: updatedFlows });
    setActiveView(flowId);
  }, [activeSection, onUpdate]);

  const totalCost = (project.timeSpent / 3600000) * project.hourlyRate;

  // Render content for printing
  const printArea = document.getElementById('print-area');
  const printContent = (
    <div className="print-view">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
        <p className="text-xl text-gray-600">Game Design Document • {project.genre}</p>
        <div className="mt-4 text-sm text-gray-500">
          Последнее изменение: {new Date(project.lastModified).toLocaleString('ru-RU')}
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">1. Контент и Сеттинг</h2>
        {project.sections.map((section) => (
          <div key={section.id} className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-bold mb-3">{section.title}</h3>
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed mb-4">
              {section.content || 'Нет данных.'}
            </div>
            {section.notes && (
              <div className="bg-gray-100 p-4 rounded text-sm italic">
                <strong>Заметки:</strong> {section.notes}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="mb-12 page-break">
        <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">2. Игровая Логика</h2>
        {project.storyFlows.map((flow) => (
          <div key={flow.id} className="mb-10">
            <h3 className="text-xl font-bold mb-4">{flow.name}</h3>
            <div className="grid grid-cols-1 gap-4">
              {flow.plotNodes.map((node) => (
                <div key={node.id} className="border p-4 rounded page-break-inside-avoid">
                  <div className="font-bold mb-1">{node.title}</div>
                  <div className="text-sm text-gray-700 mb-2">{node.content}</div>
                  {node.choices.length > 0 && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      {node.choices.map((choice) => (
                        <div key={choice.id} className="text-xs text-gray-500">
                          → {choice.text} {choice.targetNodeId ? `(к: ${flow.plotNodes.find(n => n.id === choice.targetNodeId)?.title})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">3. Производственный план</h2>
        <div className="space-y-4">
          {project.tasks.filter(t => t.status !== 'done').map(task => (
            <div key={task.id} className="flex justify-between items-center border-b py-2">
              <span>{task.title}</span>
              <span className="text-xs font-bold text-gray-500 uppercase">{task.status}</span>
            </div>
          ))}
          {project.tasks.filter(t => t.status !== 'done').length === 0 && <p>Все текущие задачи выполнены.</p>}
        </div>
      </section>

      <footer className="mt-20 pt-10 border-t text-center text-xs text-gray-400">
        Сгенерировано в Forge Architect GDD • {new Date().getFullYear()}
      </footer>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      {printArea && ReactDOM.createPortal(printContent, printArea)}
      
      <aside className="w-72 border-r border-slate-800 flex flex-col bg-slate-900/20 backdrop-blur-xl shrink-0">
        <div className="p-4 border-b border-slate-800">
          
          <div className={`mb-6 p-4 rounded-3xl transition-all border shadow-2xl ${timerActive ? 'bg-emerald-600/5 border-emerald-500/30 shadow-emerald-500/5' : 'bg-slate-900 border-slate-800'}`}>
             <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Процесс создания</span>
                <div className={`w-1.5 h-1.5 rounded-full ${timerActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
             </div>
             <div className="text-2xl font-black text-white font-mono mb-1 tracking-tighter">
                {formatTime(project.timeSpent)}
             </div>
             <div className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-4">
                Заработано: {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(totalCost)}
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setTimerActive(!timerActive)}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    timerActive 
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  {timerActive ? 'Отошел' : 'За работу'}
                </button>
             </div>
          </div>

          <button 
            onClick={() => setActiveView('architecture-overview-id')}
            className={`w-full mb-6 p-4 rounded-2xl flex items-center gap-4 transition-all border ${
              isArchitectureActive 
                ? 'bg-primary-600 text-white border-primary-500 shadow-xl shadow-primary-600/20' 
                : 'bg-slate-800/30 text-slate-400 border-slate-700 hover:border-primary-500/30 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span className="text-[11px] font-black uppercase tracking-widest">Архитектура</span>
          </button>

          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Документация</span>
          </div>
          
          <nav className="space-y-0.5 overflow-y-auto no-scrollbar max-h-[180px] mb-6">
            {project.sections.map((section) => (
              <div 
                key={section.id}
                onClick={() => setActiveView(section.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all text-[12px] border ${
                  activeView === section.id 
                    ? 'bg-slate-800 text-primary-400 font-bold border-slate-700' 
                    : 'text-slate-500 hover:text-slate-200 border-transparent hover:bg-slate-800/20'
                }`}
              >
                <span className="truncate pr-2">{section.title}</span>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-800 pt-4">
             <div className="flex items-center justify-between px-1 mb-3">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Логика</span>
               <button onClick={handleCreateFlow} className="text-indigo-400 hover:text-white">+</button>
             </div>
             <div className="space-y-1 max-h-[180px] overflow-y-auto no-scrollbar">
                {project.storyFlows.map(flow => (
                  <div 
                    key={flow.id}
                    onClick={() => setActiveView(flow.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all text-[12px] border ${
                      activeView === flow.id ? 'bg-indigo-600/10 text-indigo-400 font-black border-indigo-500/30' : 'text-slate-500 hover:bg-indigo-600/5'
                    }`}
                  >
                    <span className="truncate">{flow.name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
        
        <div className="mt-auto p-4 border-t border-slate-800">
           <button 
              onClick={() => setActiveView('kanban-board-special-id')}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${
                isBoardActive ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30' : 'text-slate-500 hover:bg-emerald-500/5'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">Задачи</span>
              <span className="text-[10px] opacity-40">({project.tasks.length})</span>
           </button>
        </div>
      </aside>

      <section className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar relative">
        <div className="max-w-6xl mx-auto h-full">
          {isArchitectureActive ? (
            <ArchitectureOverview 
              project={project} 
              onNavigate={setActiveView} 
              onUpdateRate={(rate) => onUpdate({...projectRef.current, hourlyRate: rate})} 
            />
          ) : isBoardActive ? (
            <KanbanBoard project={project} onUpdate={onUpdate} />
          ) : activeFlow ? (
            <StoryFlow project={project} onUpdate={onUpdate} flowId={activeFlow.id} />
          ) : activeSection ? (
            <SectionContent 
              section={activeSection} 
              storyFlows={project.storyFlows}
              onChange={(content) => handleUpdateSection(activeSection.id, { content })}
              onNotesChange={(notes) => handleUpdateSection(activeSection.id, { notes })}
              onAttachmentsChange={(attachments) => handleUpdateSection(activeSection.id, { attachments })}
              onExportToFlow={handleExportToFlow}
              onTitleChange={(title) => {
                const updatedSections = projectRef.current.sections.map(s => s.id === activeSection.id ? { ...s, title } : s);
                onUpdate({ ...projectRef.current, sections: updatedSections });
              }}
            />
          ) : null}
        </div>
      </section>

      <aside className={`transition-all duration-500 ease-in-out bg-slate-900/50 backdrop-blur-3xl border-l border-slate-800 flex flex-col shrink-0 ${isAISidebarOpen ? 'w-[360px]' : 'w-0 overflow-hidden border-none'}`}>
        <AIAssistant 
          project={project} 
          activeSection={activeSection || project.sections[0]}
          onApplySuggestion={(suggestion, targetSectionId) => {
            const sectionId = targetSectionId || activeSection?.id || project.sections[0].id;
            const target = projectRef.current.sections.find(s => s.id === sectionId) || projectRef.current.sections[0];
            handleUpdateSection(sectionId, { content: target.content + "\n\n" + suggestion });
            if (targetSectionId) setActiveView(targetSectionId);
          }}
        />
      </aside>

      <button 
        onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
        className={`fixed right-6 bottom-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all z-[60] border-2 ${isAISidebarOpen ? 'bg-slate-800 border-slate-700 text-primary-400' : 'bg-primary-600 border-primary-500 text-white'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
      </button>
    </div>
  );
};

export default Editor;
