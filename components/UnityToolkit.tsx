
import React, { useState } from 'react';
import { GameProject, Section } from '../types';
import { getGeminiResponse } from '../services/geminiService';

interface UnityToolkitProps {
  project: GameProject;
}

const UnityToolkit: React.FC<UnityToolkitProps> = ({ project }) => {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(project.sections[0]?.id || '');

  const generateCSharpClass = async (section: Section) => {
    setIsGenerating(true);
    const prompt = `Сгенерируй C# класс (ScriptableObject) на основе данных раздела "${section.title}": ${section.content}. 
    Код должен быть готов к копированию в Unity Editor. Добавь [CreateAssetMenu] аттрибут. Используй современные стандарты C#. 
    Верни только код, без пояснений.`;
    
    const result = await getGeminiResponse(prompt, `Проект: ${project.title}, Жанр: ${project.genre}`);
    setGeneratedCode(result.text);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    const btn = document.getElementById('copy-btn');
    if (btn) {
      const original = btn.innerText;
      btn.innerText = 'СКОПИРОВАНО!';
      setTimeout(() => btn.innerText = original, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-unity-panel border border-unity-stroke rounded-sm mb-4 overflow-hidden">
        <div className="bg-unity-header px-3 py-1.5 border-b border-unity-border flex items-center justify-between">
          <span className="text-[11px] font-bold flex items-center gap-2">
            <svg className="w-4 h-4 text-unity-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/>
            </svg>
            Генератор Архитектуры
          </span>
          <span className="text-[9px] text-unity-dim uppercase tracking-wider">C# Архитектурный Мост</span>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {project.sections.map(s => (
            <button 
              key={s.id}
              onClick={() => {
                setActiveTab(s.id);
                generateCSharpClass(s);
              }}
              disabled={isGenerating}
              className={`flex items-center justify-between p-2.5 rounded-sm border transition-all text-[11px] group ${
                activeTab === s.id && generatedCode 
                ? 'bg-unity-accent border-unity-accent text-white' 
                : 'bg-unity-dark border-unity-border hover:bg-unity-hover text-unity-text'
              }`}
            >
              <span className="truncate">Класс {s.title}</span>
              {isGenerating && activeTab === s.id ? (
                 <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                <svg className="w-3 h-3 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-unity-input border border-unity-stroke rounded-sm flex flex-col min-h-[400px] overflow-hidden">
        <div className="bg-unity-header px-4 py-1.5 border-b border-unity-border flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
             </div>
             <span className="text-[10px] font-mono text-unity-dim tracking-tighter">ScriptInspector.cs — Редактор</span>
          </div>
          {generatedCode && (
            <button 
              id="copy-btn"
              onClick={handleCopy} 
              className="unity-button-primary text-[10px] px-3 py-1 shadow-sm uppercase tracking-tighter"
            >
              Копировать в буфер
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6 font-mono text-[12px] leading-relaxed relative">
          {!generatedCode && !isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
              <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/>
              </svg>
              <p className="text-xs uppercase tracking-[0.2em] font-bold">Выберите раздел для генерации архитектуры</p>
            </div>
          ) : isGenerating ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-3 bg-unity-stroke w-1/3 rounded"></div>
              <div className="h-3 bg-unity-stroke w-1/2 rounded"></div>
              <div className="h-3 bg-unity-stroke w-2/3 rounded"></div>
              <div className="h-3 bg-unity-stroke w-1/4 rounded"></div>
            </div>
          ) : (
            <pre className="text-[#dcdcdc] select-text whitespace-pre-wrap">
              {generatedCode.split('\n').map((line, i) => {
                let highlighted = line;
                if (line.trim().startsWith('//')) return <div key={i} className="text-[#6a9955]">{line}</div>;
                
                return (
                  <div key={i}>
                    {line.replace(/\b(public|private|protected|class|using|void|int|string|float|bool|new|override|static|return|if|else)\b/g, (match) => `<span class="text-[#569cd6]">${match}</span>`)
                         .replace(/\[(CreateAssetMenu|SerializeField|Header|Space)\]/g, (match) => `<span class="text-[#dcdcaa]">${match}</span>`)
                         .split(/(<span.*?<\/span>)/g).map((part, pi) => {
                           if (part.startsWith('<span')) {
                             const color = part.includes('#569cd6') ? '#569cd6' : '#dcdcaa';
                             const text = part.replace(/<span.*?>|<\/span>/g, '');
                             return <span key={pi} style={{ color }}>{text}</span>;
                           }
                           return part;
                         })
                    }
                  </div>
                );
              })}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnityToolkit;
