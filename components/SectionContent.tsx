
import React, { useRef, useState } from 'react';
import { Section, StoryFlowData, SubSection } from '../types';

interface SectionContentProps {
  section: Section;
  storyFlows: StoryFlowData[];
  onChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onNotesChange: (notes: string) => void;
  onAttachmentsChange: (attachments: string[]) => void;
  onExportToFlow: (flowId: string) => void;
  onUpdateSubSections?: (subSections: SubSection[]) => void;
}

const SectionContent: React.FC<SectionContentProps> = ({ 
  section, storyFlows, onChange, onTitleChange, onNotesChange, onAttachmentsChange, onExportToFlow, onUpdateSubSections 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFlowSelector, setShowFlowSelector] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

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

  const addSubSection = () => {
    if (!onUpdateSubSections) return;
    const newSub: SubSection = {
      id: crypto.randomUUID(),
      title: 'Новый блок (Лор/Биография)',
      content: '',
      isExpanded: true
    };
    onUpdateSubSections([...(section.subSections || []), newSub]);
  };

  const updateSubSection = (id: string, updates: Partial<SubSection>) => {
    if (!onUpdateSubSections) return;
    const updated = (section.subSections || []).map(s => s.id === id ? { ...s, ...updates } : s);
    onUpdateSubSections(updated);
  };

  const deleteSubSection = (id: string) => {
    if (!onUpdateSubSections || !confirm('Удалить этот блок?')) return;
    onUpdateSubSections((section.subSections || []).filter(s => s.id !== id));
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
    const newText = before + prefix + selection + suffix + after;
    onChange(newText);
  };

  const isLoreTarget = section.id === 'story' || section.id === 'characters';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 h-full">
      <div className="lg:col-span-3 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 w-full">
            <input 
              type="text"
              value={section.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full bg-transparent text-3xl font-black text-white outline-none placeholder-slate-900 tracking-tight"
              placeholder="Раздел"
            />
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-full" />
          </div>

          <div className="flex gap-2">
            {isLoreTarget && (
              <button 
                onClick={addSubSection}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                + Лор / Герой
              </button>
            )}
            <button 
              onClick={() => setShowFlowSelector(!showFlowSelector)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              В схему
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            ref={textareaRef}
            value={section.content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[300px] bg-slate-900/20 p-6 rounded-3xl border border-slate-800 text-slate-300 text-lg leading-relaxed outline-none resize-none focus:border-primary-500/30 transition-all"
            placeholder="Основное описание..."
          />

          {/* Lore / Sub-sections display */}
          {(section.subSections || []).length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">Архив Лор-данных</h4>
              <div className="grid grid-cols-1 gap-3">
                {section.subSections?.map(sub => (
                  <div key={sub.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                      onClick={() => updateSubSection(sub.id, { isExpanded: !sub.isExpanded })}
                    >
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-primary-500 transition-transform ${sub.isExpanded ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"/></svg>
                        <input 
                          className="bg-transparent text-sm font-black text-white outline-none w-full"
                          value={sub.title}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateSubSection(sub.id, { title: e.target.value })}
                        />
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteSubSection(sub.id); }} className="text-slate-600 hover:text-rose-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    {sub.isExpanded && (
                      <div className="p-4 pt-0">
                        <textarea 
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 outline-none h-32 resize-none mt-2 focus:border-primary-500/20"
                          value={sub.content}
                          placeholder="Детали лора или предыстория..."
                          onChange={e => updateSubSection(sub.id, { content: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Заметки</h4>
            <textarea 
              value={section.notes || ''}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 outline-none h-24 resize-none"
              placeholder="Быстрые идеи..."
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-8">
        <div>
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Референсы</h4>
              <button onClick={() => fileInputRef.current?.click()} className="w-6 h-6 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all">+</button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
           </div>
           
           <div className="space-y-4">
              {section.attachments?.map((src, i) => (
                <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-800 cursor-zoom-in" onClick={() => setViewingImage(src)}>
                  <img src={src} className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); onAttachmentsChange((section.attachments || []).filter((_, idx) => idx !== i)); }} className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
           </div>
        </div>
      </div>

      {viewingImage && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-12" onClick={() => setViewingImage(null)}>
          <img src={viewingImage} className="max-w-full max-h-full rounded-3xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default SectionContent;
