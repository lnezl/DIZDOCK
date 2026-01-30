
import React, { useRef, useState } from 'react';
import { Section, StoryFlowData } from '../types';

interface SectionContentProps {
  section: Section;
  storyFlows: StoryFlowData[];
  onChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onNotesChange: (notes: string) => void;
  onAttachmentsChange: (attachments: string[]) => void;
  onExportToFlow: (flowId: string) => void;
}

const SectionContent: React.FC<SectionContentProps> = ({ 
  section, storyFlows, onChange, onTitleChange, onNotesChange, onAttachmentsChange, onExportToFlow 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFlowSelector, setShowFlowSelector] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onAttachmentsChange([...(section.attachments || []), base64]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange((section.attachments || []).filter((_, i) => i !== index));
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    
    let appliedPrefix = prefix;
    let appliedSelection = selection;
    let appliedSuffix = suffix;

    // Smart logic for lists
    if (prefix === '\n- ') {
      if (selection.length > 0) {
        // If text is selected, prefix each line
        appliedSelection = selection
          .split('\n')
          .map(line => line.trim().startsWith('- ') ? line : `- ${line}`)
          .join('\n');
        appliedPrefix = (before.endsWith('\n') || before === '') ? '' : '\n';
        appliedSuffix = '';
      } else {
        // If no text selected, just insert the bullet
        appliedPrefix = (before === '' || before.endsWith('\n')) ? '- ' : '\n- ';
        appliedSuffix = '';
      }
    } else if (prefix === '### ') {
        // Ensure header starts on a new line
        appliedPrefix = (before === '' || before.endsWith('\n')) ? '### ' : '\n### ';
    }

    const newText = before + appliedPrefix + appliedSelection + appliedSuffix + after;
    onChange(newText);
    
    // Adjust cursor position to keep selection or place cursor correctly
    setTimeout(() => {
      textarea.focus();
      const newStart = start + appliedPrefix.length;
      const newEnd = newStart + appliedSelection.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        insertMarkdown('**', '**');
      } else if (key === 'i') {
        e.preventDefault();
        insertMarkdown('*', '*');
      } else if (key === 'l') {
        e.preventDefault();
        insertMarkdown('\n- ');
      } else if (key === 'h') {
        e.preventDefault();
        insertMarkdown('### ');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 h-full">
      <div className="lg:col-span-3 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 w-full">
            <input 
              type="text"
              value={section.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full bg-transparent text-3xl md:text-4xl font-black text-white outline-none placeholder-slate-900 tracking-tight"
              placeholder="Раздел"
            />
            <div className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 w-1 md:w-1.5 h-8 md:h-10 bg-primary-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          </div>

          <div className="relative w-full md:w-auto">
            <button 
              onClick={() => setShowFlowSelector(!showFlowSelector)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 md:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              В схему
            </button>
            
            {showFlowSelector && (
              <div className="absolute right-0 mt-2 w-full md:w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest p-2 mb-1">Выберите схему:</p>
                {storyFlows.map(flow => (
                  <button 
                    key={flow.id}
                    onClick={() => {
                      onExportToFlow(flow.id);
                      setShowFlowSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[11px] text-slate-300 hover:bg-indigo-600 hover:text-white transition-all truncate"
                  >
                    {flow.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 order-2 sm:order-1">
            {section.suggestions?.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => onChange(`${section.content}\n- ${s}`)}
                className="text-[9px] font-bold px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:border-primary-500/50 hover:text-primary-400 transition-all"
              >
                + {s}
              </button>
            ))}
          </div>
          
          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar order-1 sm:order-2 w-full sm:w-auto">
            <button onClick={() => insertMarkdown('### ')} className="p-2 shrink-0 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Заголовок (Ctrl+H)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 12h12M6 20V4M18 20V4"/></svg>
            </button>
            <button onClick={() => insertMarkdown('**', '**')} className="p-2 shrink-0 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Жирный (Ctrl+B)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
            </button>
            <button onClick={() => insertMarkdown('*', '*')} className="p-2 shrink-0 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Курсив (Ctrl+I)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
            </button>
            <button onClick={() => insertMarkdown('\n- ')} className="p-2 shrink-0 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Список (Ctrl+L)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
        </div>
        
        <div className="relative flex flex-col gap-6 editor-area-wrapper">
          <textarea
            ref={textareaRef}
            value={section.content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[350px] md:min-h-[500px] bg-slate-900/10 p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/30 focus:border-primary-500/30 text-slate-300 text-base md:text-lg leading-relaxed outline-none resize-none placeholder-slate-800 transition-all font-medium editor-textarea"
            placeholder="Ваше видение игры..."
          />
          
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Черновик и заметки</h4>
            <textarea 
              value={section.notes || ''}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 outline-none h-24 md:h-32 resize-none placeholder-slate-800"
              placeholder="Сюда можно писать идеи..."
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-8">
        <div>
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Референсы</h4>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 md:w-6 md:h-6 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all"
              >
                +
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {section.attachments?.map((src, i) => (
                <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-800">
                  <img src={src} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removeAttachment(i)} className="text-rose-500 p-2 bg-slate-900 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Статистика раздела</h4>
           <div className="flex justify-between">
             <span className="text-[9px] text-slate-600 font-bold uppercase">Слов</span>
             <span className="text-[9px] text-primary-500 font-black">{section.content.split(/\s+/).filter(x => x.length > 0).length}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SectionContent;
