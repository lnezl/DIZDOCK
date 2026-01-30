
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

const InspectorFoldout: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-unity-border/50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 py-1.5 px-1 hover:bg-unity-hover transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
          <path d="M8 5v14l11-7z"/>
        </svg>
        <span className="text-[11px] font-bold text-unity-dim uppercase tracking-wider">{title}</span>
      </button>
      {isOpen && <div className="p-3 space-y-4">{children}</div>}
    </div>
  );
};

const SectionContent: React.FC<SectionContentProps> = ({ 
  section, storyFlows, onChange, onTitleChange, onNotesChange, onAttachmentsChange, onExportToFlow, onUpdateSubSections 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      title: 'Новый Scriptable Object',
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
    if (!onUpdateSubSections || !confirm('Удалить эту запись?')) return;
    onUpdateSubSections((section.subSections || []).filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-unity-panel animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="bg-unity-header p-3 border-b border-unity-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-unity-dark border border-unity-stroke rounded flex items-center justify-center text-unity-accent">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/></svg>
          </div>
          <input 
            type="text"
            value={section.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent text-sm font-bold text-white outline-none focus:bg-unity-input px-2 py-1 rounded transition-colors w-64"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={addSubSection} className="unity-button text-[10px] uppercase font-bold tracking-tighter">+ Свойство</button>
          <button className="unity-button text-[10px] uppercase font-bold tracking-tighter">В Редакторе</button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <InspectorFoldout title="Общие Настройки">
          <div className="grid grid-cols-12 gap-y-4 items-center">
            <div className="col-span-4 inspector-label">Описание</div>
            <div className="col-span-8">
              <textarea
                value={section.content}
                onChange={(e) => onChange(e.target.value)}
                className="unity-input w-full min-h-[120px] resize-none font-medium leading-relaxed"
                placeholder="Краткое описание модуля..."
              />
            </div>

            <div className="col-span-4 inspector-label">Заметки Dev</div>
            <div className="col-span-8">
              <textarea
                value={section.notes || ''}
                onChange={(e) => onNotesChange(e.target.value)}
                className="unity-input w-full h-20 resize-none font-mono text-[11px]"
                placeholder="// TODO: добавить технические спецификации..."
              />
            </div>
          </div>
        </InspectorFoldout>

        <InspectorFoldout title="Связанные Ассеты Данных">
          <div className="space-y-3">
            {(section.subSections || []).map(sub => (
              <div key={sub.id} className="bg-unity-dark border border-unity-stroke rounded-sm overflow-hidden">
                <div className="bg-unity-header/50 px-2 py-1 flex items-center justify-between border-b border-unity-border">
                  <div className="flex items-center gap-2 flex-1">
                    <button onClick={() => updateSubSection(sub.id, { isExpanded: !sub.isExpanded })} className="text-unity-dim">
                       <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 transition-transform ${sub.isExpanded ? 'rotate-90' : ''}`}><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <input 
                      className="bg-transparent text-[11px] font-bold text-unity-text outline-none focus:bg-unity-input w-full"
                      value={sub.title}
                      onChange={e => updateSubSection(sub.id, { title: e.target.value })}
                    />
                  </div>
                  <button onClick={() => deleteSubSection(sub.id)} className="text-unity-dim hover:text-rose-500 p-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                {sub.isExpanded && (
                  <div className="p-2">
                    <textarea 
                      className="unity-input w-full h-32 text-[11px] font-mono leading-tight bg-black/20"
                      value={sub.content}
                      onChange={e => updateSubSection(sub.id, { content: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
            <button 
              onClick={addSubSection}
              className="w-full py-2 border border-dashed border-unity-stroke rounded-sm text-[10px] text-unity-dim font-bold uppercase hover:bg-unity-hover hover:text-unity-text transition-all"
            >
              + Создать новый вложенный ассет
            </button>
          </div>
        </InspectorFoldout>

        <InspectorFoldout title="Визуальные Референсы">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {section.attachments?.map((src, i) => (
              <div key={i} className="aspect-square bg-unity-dark border border-unity-stroke rounded-sm relative group cursor-zoom-in" onClick={() => setViewingImage(src)}>
                <img src={src} className="w-full h-full object-cover rounded-sm" alt="Ref" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onAttachmentsChange((section.attachments || []).filter((_, idx) => idx !== i)); 
                    }} 
                    className="p-1.5 bg-unity-panel rounded text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-unity-stroke rounded-sm text-unity-dim hover:bg-unity-hover hover:border-unity-accent transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-6 h-6 mb-1"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="text-[10px] font-bold uppercase">Загрузить</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          </div>
        </InspectorFoldout>
      </div>

      {/* Footer Stats */}
      <div className="bg-unity-header px-4 py-1.5 border-t border-unity-border flex justify-between text-[9px] font-bold text-unity-dim uppercase">
        <div className="flex gap-4">
          <span>Слов: <span className="text-white">{section.content.trim() === '' ? 0 : section.content.trim().split(/\s+/).length}</span></span>
          <span>Ассетов: <span className="text-white">{(section.subSections || []).length}</span></span>
        </div>
        <span>Блокировка Инспектора: Выкл</span>
      </div>

      {viewingImage && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-8 animate-in fade-in" onClick={() => setViewingImage(null)}>
          <img src={viewingImage} className="max-w-full max-h-full shadow-2xl border border-unity-stroke" alt="Large View" />
          <button className="absolute top-8 right-8 unity-button-primary px-4 py-2 text-xs font-bold uppercase">Закрыть</button>
        </div>
      )}
    </div>
  );
};

export default SectionContent;
