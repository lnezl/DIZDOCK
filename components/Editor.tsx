
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameProject, Section, StoryFlowData, PlotNode, SubSection } from '../types';
import SectionContent from './SectionContent';
import AIAssistant from './AIAssistant';
import KanbanBoard from './KanbanBoard';
import StoryFlow from './StoryFlow';
import ArchitectureOverview from './ArchitectureOverview';
import UnityToolkit from './UnityToolkit';

interface EditorProps {
  project: GameProject;
  onUpdate: (project: GameProject) => void;
  onUpdateAuth: (login: string, pass: string) => void;
  authData: { login: string, pass: string };
}

const Editor: React.FC<EditorProps> = ({ project, onUpdate, onUpdateAuth, authData }) => {
  const [activeView, setActiveView] = useState<string>('architecture-overview-id');
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayTime, setDisplayTime] = useState(project.timeSpent);
  
  const projectRef = useRef(project);

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

  const toggleTimer = () => {
    if (timerActive) {
      onUpdate({ ...projectRef.current, timeSpent: displayTime, lastModified: Date.now() });
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
  const isUnityToolkitActive = activeView === 'unity-toolkit-id';
  const activeFlow = project.storyFlows.find(f => f.id === activeView);
  const activeSection = project.sections.find(s => s.id === activeView);

  const handleUpdateSection = useCallback((id: string, updates: Partial<Section>) => {
    const updatedSections = projectRef.current.sections.map(s => s.id === id ? { ...s, ...updates } : s);
    onUpdate({ ...projectRef.current, sections: updatedSections });
  }, [onUpdate]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-unity-panel">
      <div className="px-3 py-2 border-b border-unity-border bg-unity-header">
         <span className="text-[10px] font-bold text-unity-dim uppercase">Иерархия</span>
      </div>
      <div className="p-2 border-b border-unity-border">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск в сцене..."
          className="unity-input w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-1 space-y-0.5">
        <div className="text-[10px] font-bold text-unity-dim px-2 pt-3 pb-1 uppercase tracking-wider">Настройки проекта</div>
        
        <button 
          onClick={() => setActiveView('architecture-overview-id')}
          className={`w-full text-left px-2 py-1 rounded-sm text-[12px] flex items-center gap-2 transition-colors ${isArchitectureActive ? 'bg-unity-accent text-white' : 'text-unity-text hover:bg-unity-hover'}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          Сборка и Данные
        </button>

        <button 
          onClick={() => setActiveView('unity-toolkit-id')}
          className={`w-full text-left px-2 py-1 rounded-sm text-[12px] flex items-center gap-2 transition-colors ${isUnityToolkitActive ? 'bg-unity-accent text-white' : 'text-unity-text hover:bg-unity-hover'}`}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5-10 5zM2 17l10 5 10-5-10-5-10 5z"/></svg>
          Редактор Скриптов
        </button>

        <button 
          onClick={() => setActiveView('kanban-board-special-id')}
          className={`w-full text-left px-2 py-1 rounded-sm text-[12px] flex items-center gap-2 transition-colors ${isBoardActive ? 'bg-unity-accent text-white' : 'text-unity-text hover:bg-unity-hover'}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>
          Консоль Задач
        </button>

        <div className="pt-4 text-[10px] font-bold text-unity-dim px-2 py-1 uppercase tracking-wider">Ассеты / Разделы</div>
        {project.sections.map(s => (
          <button 
            key={s.id}
            onClick={() => setActiveView(s.id)}
            className={`w-full text-left px-2 py-1 rounded-sm text-[12px] truncate transition-colors flex items-center gap-2 ${activeView === s.id ? 'bg-unity-accent text-white' : 'text-unity-text hover:bg-unity-hover'}`}
          >
            <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/></svg>
            {s.title}
          </button>
        ))}
      </div>

      <div className="p-3 bg-unity-dark border-t border-unity-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold text-unity-dim uppercase">ВРЕМЯ ЦПУ</span>
          <span className="font-mono text-[10px] text-emerald-400 font-bold">{formatTime(displayTime)}</span>
        </div>
        <button 
          onClick={toggleTimer} 
          className={`w-full py-1 rounded-sm text-[9px] font-bold uppercase border border-unity-stroke transition-all ${
            timerActive ? 'bg-rose-900/40 text-rose-400 border-rose-500/20' : 'bg-unity-panel text-emerald-400 border-emerald-500/20 hover:bg-unity-hover'
          }`}
        >
          {timerActive ? 'Профиль: Выкл' : 'Профиль: Вкл'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-40px)] overflow-hidden bg-unity-dark relative">
      <aside className="w-64 border-r border-unity-border hidden lg:block shrink-0">
        <SidebarContent />
      </aside>

      <section className="flex-1 overflow-y-auto no-scrollbar bg-unity-dark">
        <div className="flex flex-col h-full">
           {/* Tab Bar Sim */}
           <div className="flex bg-unity-header border-b border-unity-border overflow-hidden shrink-0">
              <div className="flex items-center px-4 py-1.5 bg-unity-panel border-r border-unity-border border-t-2 border-t-unity-accent min-w-[150px]">
                 <svg className="w-3 h-3 mr-2 text-unity-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 18V8h16v10H4z"/></svg>
                 <span className="text-[11px] font-bold truncate">Архитектор Сцены</span>
              </div>
           </div>
           
           <div className="flex-1 p-6 lg:p-10">
              <div className="max-w-5xl mx-auto h-full">
                <div className="bg-unity-panel border border-unity-stroke rounded-sm p-8 shadow-2xl min-h-full">
                  {isArchitectureActive ? (
                    <ArchitectureOverview 
                      project={project} 
                      onNavigate={setActiveView} 
                      onUpdateRate={(rate) => onUpdate({...projectRef.current, hourlyRate: rate})} 
                      onUpdateAuth={onUpdateAuth}
                      authData={authData}
                      onFullProjectImport={(importedProject) => onUpdate(importedProject)}
                    />
                  ) : isUnityToolkitActive ? (
                    <UnityToolkit project={project} />
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
                      onExportToFlow={() => {}}
                      onUpdateSubSections={(subSections) => handleUpdateSection(activeSection.id, { subSections })}
                      onTitleChange={(title) => {
                        const updatedSections = projectRef.current.sections.map(s => s.id === activeSection.id ? { ...s, title } : s);
                        onUpdate({ ...projectRef.current, sections: updatedSections });
                      }}
                    />
                  ) : null}
                </div>
              </div>
           </div>
        </div>
      </section>

      <aside className={`transition-all duration-300 border-l border-unity-border bg-unity-panel shrink-0 shadow-2xl z-40 ${isAISidebarOpen ? 'w-[400px]' : 'w-0 overflow-hidden'}`}>
        <AIAssistant 
          project={project} 
          activeSection={activeSection}
          activeView={activeView}
          onApplySuggestion={(suggestion, targetSectionId) => {
            const sectionId = targetSectionId || activeSection?.id || project.sections[0].id;
            const target = projectRef.current.sections.find(s => s.id === sectionId) || projectRef.current.sections[0];
            handleUpdateSection(sectionId, { content: target.content + "\n\n" + suggestion });
          }}
        />
      </aside>

      <button 
        onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
        className="fixed right-6 bottom-6 w-12 h-12 bg-unity-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2.5"/></svg>
      </button>
    </div>
  );
};

export default Editor;
