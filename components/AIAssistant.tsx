
import React, { useState, useRef, useEffect } from 'react';
import { GameProject, Section } from '../types';
import { getGeminiResponse } from '../services/geminiService';

interface AIAssistantProps {
  project: GameProject;
  activeSection: Section;
  onApplySuggestion: (suggestion: string, targetSectionId?: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  targetSection?: string;
  links?: { title: string; uri: string }[];
  isError?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ project, activeSection, onApplySuggestion }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleBrainstorm = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading || (!query && history.length === 0 && !activeSection.content)) return;

    setIsLoading(true);
    const userPrompt = query || `Дай экспертный совет по разделу "${activeSection.title}".`;
    
    const context = `Игра: ${project.title} (${project.genre}). Раздел: ${activeSection.title}. Текст: ${activeSection.content}`;

    const result = await getGeminiResponse(userPrompt, context);
    
    // Mapping grounding chunks to links if they exist
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
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${isLoading ? 'bg-primary-600 animate-pulse' : 'bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        </div>
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-primary-500">Forge AI</h2>
          <p className="text-[8px] text-slate-500 font-bold uppercase">Ready</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        {history.length === 0 && !isLoading && (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm italic mb-8">Задайте вопрос по геймдизайну...</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Анализ геймплея', action: 'Проанализируй механику' },
                { label: 'Идеи NPC', action: 'Предложи 3 персонажа' }
              ].map((btn, i) => (
                <button 
                  key={i}
                  onClick={() => { setQuery(btn.action); handleBrainstorm(); }}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 hover:text-primary-400 p-3 rounded-xl border border-slate-800 transition-all"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, idx) => (
          <div key={idx} className={`p-4 rounded-2xl text-[13px] border ${
            msg.role === 'user' 
              ? 'bg-primary-600/5 text-primary-100 border-primary-500/10' 
              : 'bg-slate-900 text-slate-300 border-slate-800'
          }`}>
            <span className="font-black text-[8px] uppercase tracking-widest opacity-40 block mb-2">
              {msg.role === 'user' ? 'Архитектор' : 'Система'}
            </span>
            <div className="leading-relaxed font-medium whitespace-pre-wrap">
              {msg.text}
            </div>
            
            {/* Display grounding links if available */}
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

            {msg.role === 'assistant' && !msg.isError && (
              <button 
                onClick={() => onApplySuggestion(msg.text, msg.targetSection)}
                className="mt-4 text-[9px] font-black uppercase tracking-widest bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-all"
              >
                Вставить в GDD
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-5 bg-slate-950/80 border-t border-slate-800">
        <form onSubmit={handleBrainstorm} className="relative">
          <textarea 
            disabled={isLoading}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Вопрос..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-slate-300 outline-none focus:border-primary-500/30 transition-all resize-none h-20 disabled:opacity-50"
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
