
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

  const contextualActions = useMemo<ContextualAction[]>(() => {
    if (activeView === 'architecture-overview-id') {
      return [
        { label: 'Анализ бюджета', action: 'Проанализируй текущую стоимость проекта и посоветуй, как оптимизировать расходы.' },
        { label: 'Монетизация', action: 'Предложи 3 инновационные стратегии монетизации для этого жанра.' },
        { label: 'Core Loop', action: 'Опиши идеальный core gameplay loop для этой игры.' }
      ];
    }
    
    if (activeView === 'kanban-board-special-id') {
      return [
        { label: 'Генерация задач', action: 'Предложи список из 10 приоритетных задач для реализации MVP.' },
        { label: 'Спринты', action: 'Разбей разработку этой игры на 3 логических этапа (спринта).' },
        { label: 'Риски', action: 'Какие основные производственные риски ты видишь в этом проекте?' }
      ];
    }

    if (activeSection) {
      return [
        { label: 'Развернуть мысль', action: `Дополни раздел "${activeSection.title}" более глубокими деталями.` },
        { label: 'Проф. редактура', action: `Перепиши текущее содержание раздела "${activeSection.title}" в более профессиональном тоне.` },
        { label: 'Поиск референсов', action: `Найди примеры реализации раздела "${activeSection.title}" в популярных играх.` }
      ];
    }

    return [
      { label: 'Общий аудит', action: 'Проведи краткий аудит всего текущего документа и укажи на слабые места.' },
      { label: 'Тренды рынка', action: `Какие сейчас главные тренды в жанре ${project.genre}?` }
    ];
  }, [activeView, activeSection, project.genre]);

  const handleBrainstorm = async (forcedQuery?: string) => {
    const targetQuery = forcedQuery || query;
    if (isLoading || (!targetQuery && history.length === 0)) return;

    setIsLoading(true);
    const userPrompt = targetQuery;
    
    const context = `Игра: ${project.title} (${project.genre}). Экран: ${activeView}. ${activeSection ? `Раздел: ${activeSection.title}. Текст: ${activeSection.content}` : ''}`;

    const result = await getGeminiResponse(userPrompt, context);
    
    setHistory(prev => [
      ...prev, 
      { role: 'user', text: userPrompt }, 
      { 
        role: 'assistant', 
        text: result.text, 
        isError: result.isError,
        links: result.groundingChunks?.map((chunk: any) => ({ title: chunk.web?.title || 'Источник', uri: chunk.web?.uri || '#' }))
      }
    ]);
    setQuery('');
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-unity-panel border-l border-unity-border animate-in slide-in-from-right duration-300">
      <div className="bg-unity-header px-4 py-2 border-b border-unity-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-unity-accent animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-bold text-unity-dim uppercase tracking-widest">Arcane Intelligence</span>
        </div>
        <button onClick={() => setHistory([])} className="text-[9px] text-unity-stroke hover:text-white uppercase">Clear</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {history.length === 0 && !isLoading && (
          <div className="space-y-4 opacity-80 mt-2">
             <div className="p-3 bg-unity-dark border border-unity-stroke rounded-sm">
                <p className="text-[11px] text-unity-dim leading-relaxed">Привет! Я твой ИИ-архитектор. Готов помочь с дизайном, кодом или балансом. Выбери действие или напиши свой вопрос ниже.</p>
             </div>
             <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-unity-dim uppercase px-1">Рекомендации:</p>
                {contextualActions.map((btn, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleBrainstorm(btn.action)}
                    className="w-full text-left p-2.5 bg-unity-dark border border-unity-border hover:border-unity-accent rounded-sm text-[11px] transition-all group"
                  >
                    <span className="text-unity-text group-hover:text-white">{btn.label}</span>
                  </button>
                ))}
             </div>
          </div>
        )}

        {history.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-sm border ${
              msg.role === 'user' 
                ? 'bg-unity-accent/10 border-unity-accent/30 text-unity-text' 
                : 'bg-unity-dark border-unity-border text-unity-dim'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-40">
                <span className="text-[8px] font-bold uppercase tracking-tighter">{msg.role === 'user' ? 'Developer' : 'Architect'}</span>
              </div>
              <div className="text-[12px] leading-relaxed whitespace-pre-wrap select-text">
                {msg.text}
              </div>
              
              {msg.links && msg.links.length > 0 && (
                <div className="mt-3 pt-2 border-t border-unity-border flex flex-wrap gap-2">
                  {msg.links.map((link, i) => (
                    <a key={i} href={link.uri} target="_blank" rel="noopener" className="text-[9px] text-unity-accent hover:underline flex items-center gap-1">
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                      {link.title}
                    </a>
                  ))}
                </div>
              )}

              {msg.role === 'assistant' && activeSection && !msg.isError && (
                <button 
                  onClick={() => onApplySuggestion(msg.text)}
                  className="mt-4 w-full py-1.5 bg-unity-accent text-white text-[10px] font-bold uppercase rounded-sm hover:bg-unity-accent/80 transition-colors"
                >
                  Применить к разделу
                </button>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-unity-dim">
            <div className="flex gap-1">
               <div className="w-1 h-1 bg-unity-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-1 h-1 bg-unity-accent rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
               <div className="w-1 h-1 bg-unity-accent rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <span className="text-[10px] font-mono">Процесс анализа данных...</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-unity-dark border-t border-unity-border">
        <div className="relative group">
          <textarea 
            disabled={isLoading}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Запросить ИИ-анализ..."
            className="unity-input w-full min-h-[60px] max-h-[150px] pr-10 resize-none font-medium placeholder:opacity-30"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleBrainstorm();
              }
            }}
          />
          <button 
            onClick={() => handleBrainstorm()}
            disabled={isLoading || !query.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-unity-accent text-white rounded-sm hover:opacity-80 disabled:opacity-20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeWidth="2.5"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
