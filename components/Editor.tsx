
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { GameProject, Section, StoryFlowData, PlotNode, SubSection } from '../types';
import SectionContent from './SectionContent';
import AIAssistant from './AIAssistant';
import KanbanBoard from './KanbanBoard';
import StoryFlow from './StoryFlow';
import ArchitectureOverview from './ArchitectureOverview';

interface EditorProps {
  project: GameProject;
  onUpdate: (project: GameProject) => void;
  onUpdateAuth: (login: string, pass: string) => void;
  authData: { login: string, pass: string };
}

const Editor: React.FC<EditorProps> = ({ project, onUpdate, onUpdateAuth, authData }) => {
  const [activeView, setActiveView] = useState<string>('architecture-overview-id');
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [displayTime, setDisplayTime] = useState(project.timeSpent);
  
  const projectRef = useRef(project);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    projectRef.current = project;
    setDisplayTime(project.timeSpent);
  }, [project.id]);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => {
        setDisplayTime(prev => prev + 1000);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    if (timerActive) {
      syncTimerRef.current = setInterval(() => {
        onUpdate({
          ...projectRef.current,
          timeSpent: projectRef.current.timeSpent + 60000,
          lastModified: Date.now()
        });
      }, 60000);
    } else {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    }
    
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [timerActive, onUpdate]);

  const toggleTimer = () => {
    if (timerActive) {
      onUpdate({
        ...projectRef.current,
        timeSpent: displayTime,
        lastModified: Date.now()
      });
    }
    setTimerActive(!timerActive);
  };

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

  const totalCost = (displayTime / 3600000) * project.hourlyRate;

  const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 animate-[spin_8s_linear_infinite]">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const filteredSections = project.sections.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredFlows = project.storyFlows.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SidebarContent = () => (
    <div className="p-4 flex flex-col h-full overflow-hidden">
      <div className="mb-4 relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-500 group-focus-within:text-primary-500 transition-colors">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Быстрый поиск..."
          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-9 pr-8 text-[11px] font-bold text-slate-300 outline-none focus:border-primary-500/50 transition-all placeholder-slate-600"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-2 flex items-center text-slate-600 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      <div className={`mb-6 p-4 rounded-3xl transition-all border shadow-2xl shrink-0 ${timerActive ? 'bg-emerald-600/5 border-emerald-500/30 shadow-emerald-500/5' : 'bg-slate-900 border-slate-800'}`}>
         <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Процесс создания</span>
            <div className={`w-1.5 h-1.5 rounded-full ${timerActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
         </div>
         <div className="text-2xl font-black text-white font-mono mb-1 tracking-tighter">
            {formatTime(displayTime)}
         </div>
         <div className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-4">
            Заработано: {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(totalCost)}
         </div>
         <div className="flex gap-2">
            <button 
              onClick={toggleTimer}
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

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
        <button 
          onClick={() => { setActiveView('architecture-overview-id'); setIsMobileMenuOpen(false); }}
          className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border transform duration-300 ${
            isArchitectureActive 
              ? 'bg-primary-600 text-white border-primary-500 shadow-xl shadow-primary-600/20 hover:scale-[1.02]' 
              : 'bg-slate-800/30 text-slate-400 border-slate-700 hover:border-primary-500/30 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span className="text-[11px] font-black uppercase tracking-widest">Архитектура</span>
          </div>
          {isArchitectureActive && <SettingsIcon />}
        </button>

        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Документация</span>
          </div>
          
          <nav className="space-y-0.5">
            {filteredSections.map((section) => (
              <div 
                key={section.id}
                onClick={() => { setActiveView(section.id); setIsMobileMenuOpen(false); }}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all transform duration-300 text-[12px] border ${
                  activeView === section.id 
                    ? 'bg-slate-800 text-primary-400 font-bold border-slate-700 hover:scale-[1.02]' 
                    : 'text-slate-500 hover:text-slate-200 border-transparent hover:bg-slate-800/20'
                }`}
              >
                <span className="truncate pr-2">{section.title}</span>
                {activeView === section.id && <SettingsIcon />}
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
           <div className="flex items-center justify-between px-1 mb-3">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Логика</span>
             <button onClick={handleCreateFlow} className="text-indigo-400 hover:text-white transition-colors">+</button>
           </div>
           <div className="space-y-1">
              {filteredFlows.map(flow => (
                <div 
                  key={flow.id}
                  onClick={() => { setActiveView(flow.id); setIsMobileMenuOpen(false); }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all transform duration-300 text-[12px] border ${
                    activeView === flow.id ? 'bg-indigo-600/10 text-indigo-400 font-black border-indigo-500/30 hover:scale-[1.02]' : 'text-slate-500 hover:bg-indigo-600/5'
                  }`}
                >
                  <span className="truncate">{flow.name}</span>
                  {activeView === flow.id && <SettingsIcon />}
                </div>
              ))}
           </div>
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-slate-800 shrink-0">
         <button 
            onClick={() => { setActiveView('kanban-board-special-id'); setIsMobileMenuOpen(false); }}
            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all transform duration-300 border ${
              isBoardActive ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30 hover:scale-[1.02]' : 'text-slate-500 hover:bg-emerald-500/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-widest">Задачи</span>
              <span className="text-[10px] opacity-40">({project.tasks.length})</span>
            </div>
            {isBoardActive && <SettingsIcon />}
         </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950 relative">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[100] lg:z-auto
        w-72 border-r border-slate-800 flex flex-col bg-slate-900/90 lg:bg-slate-900/20 backdrop-blur-xl shrink-0
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed left-4 bottom-6 w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-white flex items-center justify-center shadow-2xl z-[80]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <section className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 no-scrollbar relative w-full">
        <div className="max-w-6xl mx-auto h-full">
          {isArchitectureActive ? (
            <ArchitectureOverview 
              project={project} 
              onNavigate={setActiveView} 
              onUpdateRate={(rate) => onUpdate({...projectRef.current, hourlyRate: rate})} 
              onUpdateAuth={onUpdateAuth}
              authData={authData}
              onFullProjectImport={(importedProject) => onUpdate(importedProject)}
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
              onUpdateSubSections={(subSections) => handleUpdateSection(activeSection.id, { subSections })}
              onTitleChange={(title) => {
                const updatedSections = projectRef.current.sections.map(s => s.id === activeSection.id ? { ...s, title } : s);
                onUpdate({ ...projectRef.current, sections: updatedSections });
              }}
            />
          ) : null}
        </div>
      </section>

      <aside className={`
        fixed lg:static right-0 inset-y-0 z-[110] lg:z-auto
        transition-all duration-500 ease-in-out bg-slate-900 lg:bg-slate-900/50 backdrop-blur-3xl border-l border-slate-800 flex flex-col shrink-0
        ${isAISidebarOpen ? 'w-full md:w-[360px]' : 'w-0 overflow-hidden border-none'}
      `}>
        <AIAssistant 
          project={project} 
          activeSection={activeSection}
          activeView={activeView}
          onApplySuggestion={(suggestion, targetSectionId) => {
            const sectionId = targetSectionId || activeSection?.id || project.sections[0].id;
            const target = projectRef.current.sections.find(s => s.id === sectionId) || projectRef.current.sections[0];
            handleUpdateSection(sectionId, { content: target.content + "\n\n" + suggestion });
            if (targetSectionId) setActiveView(targetSectionId);
            if (window.innerWidth < 1024) setIsAISidebarOpen(false);
          }}
        />
        {isAISidebarOpen && (
          <button 
            onClick={() => setIsAISidebarOpen(false)}
            className="lg:hidden absolute top-4 left-4 p-2 text-slate-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </aside>

      <button 
        onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
        className={`fixed right-4 md:right-6 bottom-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all z-[60] border-2 ${isAISidebarOpen ? 'bg-slate-800 border-slate-700 text-primary-400' : 'bg-primary-600 border-primary-500 text-white'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
      </button>
    </div>
  );
};

export default Editor;
