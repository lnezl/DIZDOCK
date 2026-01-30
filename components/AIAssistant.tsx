
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GameProject, Section } from '../types';
import { getGeminiResponse } from '../services/geminiService';

interface AIAssistantProps {
  project: GameProject;
  activeSection?: Section;
  activeView: string;
  onApplySuggestion: (suggestion: string, targetSectionId?: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  targetSection?: string;
  links?: { title: string; uri: string }[];
  isError?: boolean;
}

interface ContextualAction {
  label: string;
  action: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ project, activeSection, activeView, onApplySuggestion }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  // Generate contextual suggestions based on current view/active section
  const contextualActions = useMemo<ContextualAction[]>(() => {
    // 1. Architecture Overview Context
    if (activeView === 'architecture-overview-id') {
      return [
        { label: 'Анализ бюджета', action: 'Проанализируй текущую стоимость проекта и посоветуй, как оптимизировать расходы.' },
        { label: 'Монетизация', action: 'Предложи 3 инновационные стратегии монетизации для этого жанра.' },
        { label: 'Core Loop', action: 'Опиши идеальный core gameplay loop для этой игры.' }
      ];
    }
    
    // 2. Kanban Board Context
    if (activeView === 'kanban-board-special-id') {
      return [
        { label: 'Генерация задач', action: 'Предложи список из 10 приоритетных задач для реализации MVP.' },
        { label: 'Спринты', action: 'Разбей разработку этой игры на 3 логических этапа (спринта).' },
        { label: 'Риски', action: 'Какие основные производственные риски ты видишь в этом проекте?' }
      ];
    }

    // 3. StoryFlow Context
    const flow = project.storyFlows.find(f => f.id === activeView);
    if (flow) {
      return [
        { label: 'Сюжетный поворот', action: `Предложи неожиданный сюжетный поворот для схемы "${flow.name}".` },
        { label: 'Проверка логики', action: 'Найди логические дыры в текущей схеме переходов.' },
        { label: 'Диалоги', action: 'Напиши черновик диалога для одной из ключевых сцен в этой схеме.' }
      ];
    }

    // 4. Specific GDD Section Context
    if (activeSection) {
      const baseActions = [
        { label: 'Развернуть мысль', action: `Дополни раздел "${activeSection.title}" более глубокими деталями.` },
        { label: 'Проф. редактура', action: `Перепиши текущее содержание раздела "${activeSection.title}" в более профессиональном тоне.` }
      ];

      // Add section-specific prompts
      if (activeSection.id === 'concept') {
        baseActions.push({ label: 'Elevator Pitch', action: 'Сформулируй краткую презентацию игры (Elevator Pitch) для издателя.' });
      } else if (activeSection.id === 'mechanics') {
        baseActions.push({ label: 'Геймплейный цикл', action: 'Как сделать эти механики более аддиктивными и удерживающими игрока?' });
      } else if (activeSection.id === 'story') {
        baseActions.push({ label: 'Проработка антагониста', action: 'Предложи глубокую мотивацию для главного злодея этого мира.' });
      }

      return baseActions;
    }

    // Default actions
    return [
      { label: 'Общий аудит GDD', action: 'Проведи краткий аудит всего текущего документа и укажи на слабые места.' },
      { label: 'Тренды рынка', action: `Какие сейчас главные тренды в жанре ${project.genre}?` }
    ];
  }, [activeView, activeSection, project.storyFlows, project.genre]);

  const handleBrainstorm = async (forcedQuery?: string) => {
    const targetQuery = forcedQuery || query;
    if (isLoading || (!targetQuery && history.length === 0 && !activeSection?.content)) return;

    setIsLoading(true);
    const userPrompt = targetQuery || `Дай экспертный совет по разделу "${activeSection?.title || 'Архитектура'}".`;
    
    const context = `Игра: ${project.title} (${project.genre}). 
                     Текущий экран: ${activeView}. 
                     ${activeSection ? `Раздел GDD: ${activeSection.title}. Текст: ${activeSection.content}` : 'Общий контекст проекта.'}`;

    const result = await getGeminiResponse(userPrompt, context);
    
    const links = result.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Источник',
      uri: chunk.web?.uri || '#'
    })).filter((link: any) => link.uri !== '#');

    setHistory(prev => [
      ...prev, 
      { role: 'user', text: userPrompt }, 
      { 
        role: 'assistant', 
        text: result.text, 
        isError: result.isError,
        links: links
      }
    ]);
    setQuery('');
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 relative">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${isLoading ? 'bg-primary-600 animate-pulse' : 'bg-slate-800'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-primary-500">Arcane AI</h2>
            <p className="text-[8px] text-slate-500 font-bold uppercase">{isLoading ? 'Анализ...' : 'Ready'}</p>
          </div>
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setHistory([])}
            className="text-[8px] font-black text-slate-600 hover:text-rose-500 uppercase tracking-widest transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        {/* Welcome message and contextual suggestions when chat is empty */}
        {history.length === 0 && !isLoading && (
          <div className="text-center py-6">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 opacity-60">Контекстные действия</p>
            <div className="flex flex-col gap-3">
              {contextualActions.map((btn, i) => (
                <button 
                  key={i}
                  onClick={() => handleBrainstorm(btn.action)}
                  className="text-left group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-primary-500/50 transition-all shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-primary-400 transition-colors">{btn.label}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-700 group-hover:text-primary-500 group-hover:translate-x-1 transition-all"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, idx) => (
          <div key={idx} className={`p-4 rounded-2xl text-[13px] border ${
            msg.role === 'user' 
              ? 'bg-primary-600/5 text-primary-100 border-primary-500/10' 
              : 'bg-slate-900 text-slate-300 border-slate-800 shadow-xl relative overflow-hidden'
          }`}>
            {msg.role === 'assistant' && (
              <div className="absolute top-0 left-0 w-1 h-full bg-primary-600/20" />
            )}
            <span className="font-black text-[8px] uppercase tracking-widest opacity-40 block mb-2">
              {msg.role === 'user' ? 'Архитектор' : 'Система'}
            </span>
            <div className="leading-relaxed font-medium whitespace-pre-wrap">
              {msg.text}
            </div>
            
            {msg.links && msg.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {msg.links.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary-400 hover:underline flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    {link.title}
                  </a>
                ))}
              </div>
            )}

            {msg.role === 'assistant' && !msg.isError && activeSection && (
              <button 
                onClick={() => onApplySuggestion(msg.text, msg.targetSection)}
                className="mt-4 w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest bg-primary-600 hover:bg-primary-500 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-primary-600/20"
              >
                <span>Применить к разделу</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            )}
          </div>
        ))}
        
        {/* Helper quick actions visible even when chat has content */}
        {history.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-900">
             {contextualActions.slice(0, 3).map((btn, i) => (
               <button 
                key={i}
                onClick={() => handleBrainstorm(btn.action)}
                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl transition-all"
               >
                 {btn.label}
               </button>
             ))}
          </div>
        )}
      </div>

      <div className="p-5 bg-slate-950/80 border-t border-slate-800">
        <form onSubmit={(e) => { e.preventDefault(); handleBrainstorm(); }} className="relative">
          <textarea 
            disabled={isLoading}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="О чем подумаем?.."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-slate-300 outline-none focus:border-primary-500/30 transition-all resize-none h-20 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleBrainstorm();
              }
            }}
          />
          <button 
            type="submit"
            disabled={isLoading || !query}
            className="absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-all disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
