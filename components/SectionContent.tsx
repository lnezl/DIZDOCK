
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
      title: 'Новая запись (Лор/Персонаж)',
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
    if (!onUpdateSubSections || !confirm('Удалить этот подраздел?')) return;
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

  // Показываем кнопку создания подразделов только в сюжетных разделах
  const isLoreSection = section.id === 'story' || section.id === 'characters' || section.id === 'concept';

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
              placeholder="Заголовок раздела"
            />
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          </div>

          <div className="flex gap-2">
            {isLoreSection && (
              <button 
                onClick={addSubSection}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
              >
                + Лор / Герой
              </button>
            )}
            <button 
              onClick={() => setShowFlowSelector(!showFlowSelector)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
              В схему
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={section.content}
              onChange={(e) => onChange(e.target.value)}
              className="w-full min-h-[250px] bg-slate-900/20 p-6 rounded-3xl border border-slate-800 text-slate-300 text-lg leading-relaxed outline-none resize-none focus:border-primary-500/30 transition-all font-medium"
              placeholder="Основное описание раздела..."
            />
          </div>

          {/* Lore / Sub-sections display */}
          {(section.subSections || []).length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">Архив данных раздела</h4>
              <div className="grid grid-cols-1 gap-3">
                {section.subSections?.map(sub => (
                  <div key={sub.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden group/sub">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                      onClick={() => updateSubSection(sub.id, { isExpanded: !sub.isExpanded })}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-primary-500 transition-transform ${sub.isExpanded ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"/></svg>
                        <input 
                          className="bg-transparent text-[13px] font-black text-white outline-none w-full"
                          value={sub.title}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateSubSection(sub.id, { title: e.target.value })}
                        />
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteSubSection(sub.id); }} className="text-slate-600 hover:text-rose-500 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    {sub.isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-800/30">
                        <textarea 
                          className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl p-4 text-xs text-slate-300 outline-none h-32 resize-none mt-4 focus:border-primary-500/20"
                          value={sub.content}
                          placeholder="Детали лора, биография персонажа или спецификации..."
                          onChange={e => updateSubSection(sub.id, { content: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Черновик / Идеи</h4>
            <textarea 
              value={section.notes || ''}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 outline-none h-24 resize-none focus:border-slate-700"
              placeholder="Сюда можно скидывать ссылки, мысли и временные заметки..."
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-8">
        <div className="bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800">
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Галерея</h4>
              <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all shadow-lg">+</button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
           </div>
           
           <div className="space-y-4">
              {section.attachments?.map((src, i) => (
                <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-800 cursor-zoom-in hover:border-primary-500/50 transition-all" onClick={() => setViewingImage(src)}>
                  <img src={src} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAttachmentsChange((section.attachments || []).filter((_, idx) => idx !== i)); }} 
                      className="p-2 bg-slate-900 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {(section.attachments || []).length === 0 && (
                <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-700 text-[9px] font-black uppercase tracking-widest">
                  Нет референсов
                </div>
              )}
           </div>
        </div>
      </div>

      {viewingImage && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-8 lg:p-20 animate-in fade-in" onClick={() => setViewingImage(null)}>
          <img src={viewingImage} className="max-w-full max-h-full rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-slate-900" />
          <button className="absolute top-8 right-8 text-white p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
};

export default SectionContent;
