
import React, { useState, useRef, useEffect } from 'react';
import { GameProject, PlotNode, PlotChoice, StoryFlowData } from '../types';
import { toPng } from 'html-to-image';

interface StoryFlowProps {
  project: GameProject;
  onUpdate: (project: GameProject) => void;
  flowId: string;
}

interface ConnectingState {
  sourceNodeId: string;
  choiceId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const StoryFlow: React.FC<StoryFlowProps> = ({ project, onUpdate, flowId }) => {
  const currentFlow = project.storyFlows.find(f => f.id === flowId);
  const [localNodes, setLocalNodes] = useState<PlotNode[]>(currentFlow?.plotNodes || []);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasLayerRef = useRef<HTMLDivElement>(null);
  const lastProjectNodesRef = useRef<PlotNode[]>(currentFlow?.plotNodes || []);

  useEffect(() => {
    if (currentFlow) {
      setLocalNodes(currentFlow.plotNodes);
      lastProjectNodesRef.current = currentFlow.plotNodes;
    }
  }, [flowId]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      syncWithProject();
    }, 3000);
    return () => clearInterval(autoSaveInterval);
  }, [localNodes]);

  const syncWithProject = () => {
    if (!currentFlow) return;
    const hasChanges = JSON.stringify(localNodes) !== JSON.stringify(lastProjectNodesRef.current);
    if (hasChanges) {
      setIsSyncing(true);
      onUpdate({
        ...project,
        storyFlows: project.storyFlows.map(f => 
          f.id === flowId ? { ...f, plotNodes: localNodes } : f
        )
      });
      lastProjectNodesRef.current = localNodes;
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleExportImage = async () => {
    if (!canvasLayerRef.current) return;
    setIsExporting(true);
    
    try {
      if (localNodes.length === 0) {
        alert("Нет нод для экспорта");
        setIsExporting(false);
        return;
      }

      const minX = Math.min(...localNodes.map(n => n.position.x)) - 100;
      const minY = Math.min(...localNodes.map(n => n.position.y)) - 100;
      const maxX = Math.max(...localNodes.map(n => n.position.x)) + 320;
      const maxY = Math.max(...localNodes.map(n => n.position.y)) + 240;
      
      const width = maxX - minX;
      const height = maxY - minY;

      const dataUrl = await toPng(canvasLayerRef.current, {
        cacheBust: true,
        width: width,
        height: height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          left: `-${minX}px`,
          top: `-${minY}px`,
          backgroundColor: '#020617'
        }
      });
      
      const link = document.createElement('a');
      link.download = `arcane-flow-${currentFlow?.name || 'export'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('Не удалось экспортировать изображение');
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentFlow) return null;

  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 140;

  const addNode = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const scrollTop = containerRef.current?.scrollTop || 0;
    
    const x = (e.clientX - rect.left + scrollLeft) / zoom - NODE_WIDTH / 2;
    const y = (e.clientY - rect.top + scrollTop) / zoom - 20;

    const newNode: PlotNode = {
      id: crypto.randomUUID(),
      title: 'Новая сцена',
      type: 'scene',
      content: '',
      choices: [],
      color: 'indigo',
      position: { x: Math.max(0, x), y: Math.max(0, y) }
    };
    
    const updatedNodes = [...localNodes, newNode];
    setLocalNodes(updatedNodes);
    setInlineEditingId(newNode.id);
    
    onUpdate({
      ...project,
      storyFlows: project.storyFlows.map(f => f.id === flowId ? { ...f, plotNodes: updatedNodes } : f)
    });
  };

  const updateNodeLocal = (updatedNode: PlotNode) => {
    setLocalNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  const deleteConnection = (sourceNodeId: string, choiceId: string) => {
    const node = localNodes.find(n => n.id === sourceNodeId);
    if (!node) return;
    const updatedChoices = node.choices.map(c => 
      c.id === choiceId ? { ...c, targetNodeId: null } : c
    );
    updateNodeLocal({ ...node, choices: updatedChoices });
  };

  const handleMouseDown = (e: React.MouseEvent, node: PlotNode) => {
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('.port') || 
        (e.target as HTMLElement).closest('input') || 
        (e.target as HTMLElement).closest('textarea')) return;
        
    e.stopPropagation();
    setDraggingNodeId(node.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const scrollTop = containerRef.current?.scrollTop || 0;

    setDragOffset({
      x: (e.clientX - rect.left + scrollLeft) / zoom - node.position.x,
      y: (e.clientY - rect.top + scrollTop) / zoom - node.position.y
    });
  };

  const handleStartConnect = (e: React.MouseEvent, node: PlotNode, choiceId: string) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const scrollTop = containerRef.current?.scrollTop || 0;
    
    const startX = (e.clientX - rect.left + scrollLeft) / zoom;
    const startY = (e.clientY - rect.top + scrollTop) / zoom;
    setConnecting({ sourceNodeId: node.id, choiceId, startX, startY, currentX: startX, currentY: startY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const scrollTop = containerRef.current?.scrollTop || 0;
    
    const x = (e.clientX - rect.left + scrollLeft) / zoom;
    const y = (e.clientY - rect.top + scrollTop) / zoom;

    if (draggingNodeId) {
      setLocalNodes(prev => prev.map(n => 
        n.id === draggingNodeId ? { ...n, position: { x: x - dragOffset.x, y: y - dragOffset.y } } : n
      ));
    }

    if (connecting) {
      setConnecting({ ...connecting, currentX: x, currentY: y });
      const hitNode = localNodes.find(n => 
        n.id !== connecting.sourceNodeId &&
        x >= n.position.x && x <= n.position.x + NODE_WIDTH &&
        y >= n.position.y && y <= n.position.y + NODE_HEIGHT
      );
      setHoveredNodeId(hitNode?.id || null);
    }
  };

  const handleMouseUp = () => {
    if (connecting) {
      const sourceNode = localNodes.find(n => n.id === connecting.sourceNodeId);
      if (sourceNode) {
        // Условие разрыва: если hoveredNodeId === null, значит отпустили в пустоту
        const updatedChoices = sourceNode.choices.map(c => 
          c.id === connecting.choiceId ? { ...c, targetNodeId: hoveredNodeId } : c
        );
        updateNodeLocal({ ...sourceNode, choices: updatedChoices });
      }
    }
    
    if (draggingNodeId || connecting) {
      syncWithProject();
    }
    
    setDraggingNodeId(null);
    setConnecting(null);
    setHoveredNodeId(null);
  };

  const renderConnections = () => {
    return localNodes.flatMap(node => 
      node.choices.filter(c => c.targetNodeId).map(choice => {
        const target = localNodes.find(n => n.id === choice.targetNodeId);
        if (!target) return null;
        const choiceIndex = node.choices.findIndex(c => c.id === choice.id);
        const startX = node.position.x + NODE_WIDTH;
        const startY = node.position.y + 65 + (choiceIndex * 24); 
        const endX = target.position.x;
        const endY = target.position.y + NODE_HEIGHT / 2;
        
        const curvature = Math.abs(endX - startX) * 0.4 + 10;
        const cp1x = startX + curvature;
        const cp1y = startY;
        const cp2x = endX - curvature;
        const cp2y = endY;
        
        // Find mid point for the delete button
        const t = 0.5;
        const midX = Math.pow(1-t, 3)*startX + 3*Math.pow(1-t, 2)*t*cp1x + 3*(1-t)*Math.pow(t, 2)*cp2x + Math.pow(t, 3)*endX;
        const midY = Math.pow(1-t, 3)*startY + 3*Math.pow(1-t, 2)*t*cp1y + 3*(1-t)*Math.pow(t, 2)*cp2y + Math.pow(t, 3)*endY;

        return (
          <g key={`${node.id}-${choice.id}`} className="group/link pointer-events-auto">
            <path 
              d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`} 
              fill="none" 
              stroke="transparent" 
              strokeWidth="24" 
              className="cursor-pointer" 
            />
            <path 
              d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`} 
              fill="none" 
              stroke="rgba(99, 102, 241, 0.4)" 
              strokeWidth="2.5" 
              markerEnd="url(#arrowhead)" 
              className="group-hover/link:stroke-indigo-400 group-hover/link:stroke-[5px] transition-all" 
            />
            <g transform={`translate(${midX - 12}, ${midY - 12})`} className="opacity-0 group-hover/link:opacity-100 transition-opacity cursor-pointer" onClick={(e) => { e.stopPropagation(); deleteConnection(node.id, choice.id); }}>
              <circle r="12" cx="12" cy="12" className="fill-slate-900 stroke-rose-500 stroke-2" />
              <path d="M 8 8 L 16 16 M 16 8 L 8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </g>
        );
      })
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">{currentFlow.name}</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Тяни порт в пустоту или ПКМ для удаления связи</p>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 bg-slate-900/40 ${isSyncing ? 'border-indigo-500/50 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'border-slate-800 text-slate-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{isSyncing ? 'Обновление...' : 'Синхронизировано'}</span>
          </div>
        </div>

        <div className="flex gap-4 items-center">
           <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="text-slate-500 hover:text-white transition-colors">-</button>
              <span className="text-[10px] font-mono text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="text-slate-500 hover:text-white transition-colors">+</button>
           </div>
           
           <button 
             onClick={handleExportImage}
             disabled={isExporting}
             className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-slate-700 flex items-center gap-2 disabled:opacity-50"
           >
             {isExporting ? (
               <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
             )}
             PNG
           </button>

           <button onClick={(e) => addNode(e as any)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
             + Сцена
           </button>
        </div>
      </div>

      <div 
        ref={containerRef} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseUp} 
        onDoubleClick={addNode} 
        className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-[2rem] relative overflow-auto no-scrollbar bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
      >
        <div 
          ref={canvasLayerRef}
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: '0 0', 
            width: '5000px', 
            height: '5000px',
            pointerEvents: 'none'
          }} 
          className="absolute inset-0"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
              </marker>
            </defs>
            {renderConnections()}
            {connecting && (
              <path 
                d={`M ${connecting.startX} ${connecting.startY} C ${connecting.startX + 100} ${connecting.startY}, ${connecting.currentX - 100} ${connecting.currentY}, ${connecting.currentX} ${connecting.currentY}`} 
                fill="none" 
                stroke="#fbbf24" 
                strokeWidth="3" 
                strokeDasharray="5,5" 
                className="animate-[dash_1s_linear_infinite]" 
              />
            )}
          </svg>

          {localNodes.map((node) => (
            <div 
              key={node.id} 
              onMouseDown={(e) => handleMouseDown(e, node)} 
              onDoubleClick={(e) => { 
                e.stopPropagation(); 
                setInlineEditingId(node.id); 
              }} 
              style={{ 
                left: node.position.x, 
                top: node.position.y, 
                width: NODE_WIDTH, 
                minHeight: NODE_HEIGHT,
                pointerEvents: 'auto'
              }} 
              className={`node-card absolute z-10 p-4 rounded-2xl border-2 cursor-grab active:cursor-grabbing transition-all ${
                draggingNodeId === node.id ? 'scale-105 shadow-2xl z-20 border-indigo-400 bg-indigo-600/10' : 
                inlineEditingId === node.id ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 
                hoveredNodeId === node.id ? 'bg-amber-500/10 border-amber-500 scale-[1.02]' : 
                'bg-slate-900/90 border-slate-800'
              }`}
            >
              {inlineEditingId === node.id ? (
                <div className="space-y-2">
                  <input 
                    autoFocus
                    className="w-full bg-slate-950/80 border border-indigo-500/30 rounded px-2 py-1 text-[11px] font-black text-white outline-none focus:border-indigo-500"
                    value={node.title}
                    onChange={e => updateNodeLocal({ ...node, title: e.target.value })}
                    onBlur={() => setInlineEditingId(null)}
                    onKeyDown={e => e.key === 'Enter' && setInlineEditingId(null)}
                  />
                  <textarea
                    className="w-full bg-slate-950/80 border border-indigo-500/30 rounded px-2 py-1 text-[9px] text-slate-300 outline-none h-16 resize-none focus:border-indigo-500"
                    value={node.content}
                    placeholder="Описание..."
                    onChange={e => updateNodeLocal({ ...node, content: e.target.value })}
                    onBlur={() => setInlineEditingId(null)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[11px] font-black text-white truncate group-hover:text-primary-400 transition-colors">
                      {node.title}
                    </h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-600 opacity-40">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <p className="text-[9px] text-slate-500 line-clamp-3 mb-3 leading-relaxed">
                    {node.content || 'Нажмите дважды для редактирования...'}
                  </p>
                </>
              )}
              
              <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                 {node.choices.map((choice) => (
                   <div key={choice.id} className="flex items-center justify-between group/choice">
                      <span className="text-[8px] text-slate-400 truncate max-w-[140px] group-hover/choice:text-slate-200 transition-colors">{choice.text}</span>
                      <div 
                        onMouseDown={(e) => handleStartConnect(e, node, choice.id)} 
                        onContextMenu={(e) => {
                          e.preventDefault();
                          deleteConnection(node.id, choice.id);
                          syncWithProject();
                        }}
                        className={`port w-3.5 h-3.5 rounded-full border-2 transition-all cursor-crosshair ${
                          choice.targetNodeId ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 
                          'bg-slate-800 border-slate-700 hover:border-amber-500 hover:bg-amber-500/20'
                        }`} 
                        title="ЛКМ — тянуть связь, ПКМ — убрать связь"
                      />
                   </div>
                 ))}
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newChoice = { id: crypto.randomUUID(), text: 'Новое действие', targetNodeId: null };
                    updateNodeLocal({ ...node, choices: [...node.choices, newChoice] });
                  }}
                  className="w-full mt-1 border border-dashed border-slate-800 rounded py-1 text-[7px] font-black text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all uppercase tracking-widest"
                 >
                   + выбор
                 </button>
              </div>
              
              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingNodeId(node.id); }} 
                  className="flex-1 text-[7px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-2 py-1 rounded hover:text-white transition-colors"
                >
                  Настройки
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Удалить?')) {
                      setLocalNodes(prev => prev.filter(n => n.id !== node.id));
                      syncWithProject();
                    }
                  }}
                  className="text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingNodeId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm" onClick={() => { setEditingNodeId(null); syncWithProject(); }}>
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            {(() => {
              const node = localNodes.find(n => n.id === editingNodeId);
              if (!node) return null;
              return (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Заголовок сцены</label>
                    <input className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xl font-black text-white outline-none w-full focus:border-indigo-500/50 transition-all" value={node.title} onChange={e => updateNodeLocal({ ...node, title: e.target.value })} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Содержимое / Скрипт</label>
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none h-32 resize-none focus:border-indigo-500/50 transition-all" value={node.content} onChange={e => updateNodeLocal({ ...node, content: e.target.value })} placeholder="Опишите, что происходит в этой сцене..." />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">Варианты выбора / Переходы</label>
                      <button onClick={() => {
                        const newChoice = { id: crypto.randomUUID(), text: 'Новое действие', targetNodeId: null };
                        updateNodeLocal({ ...node, choices: [...node.choices, newChoice] });
                      }} className="text-indigo-400 text-[10px] font-black hover:text-white transition-colors">+ ДОБАВИТЬ</button>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                      {node.choices.map((c, i) => (
                        <div key={c.id} className="flex gap-2 group/edit-choice">
                          <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-white focus:border-indigo-500/30 outline-none" value={c.text} onChange={e => {
                            const newChoices = [...node.choices];
                            newChoices[i].text = e.target.value;
                            updateNodeLocal({ ...node, choices: newChoices });
                          }} />
                          <button onClick={() => updateNodeLocal({ ...node, choices: node.choices.filter(item => item.id !== c.id) })} className="text-rose-500 hover:scale-110 transition-transform px-2">×</button>
                        </div>
                      ))}
                      {node.choices.length === 0 && (
                        <p className="text-[10px] text-slate-700 italic text-center py-4 border border-dashed border-slate-800 rounded-xl">Нет доступных выборов</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-2">
                    <button 
                      onClick={() => {
                        if (confirm('Удалить эту сцену?')) {
                          setLocalNodes(prev => prev.filter(n => n.id !== editingNodeId));
                          setEditingNodeId(null);
                          setTimeout(syncWithProject, 100);
                        }
                      }}
                      className="flex-1 bg-rose-500/10 text-rose-500 font-black py-3 rounded-xl text-[10px] uppercase border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      Удалить
                    </button>
                    <button onClick={() => { setEditingNodeId(null); syncWithProject(); }} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl text-[10px] uppercase transition-all shadow-lg shadow-indigo-600/20">
                      Сохранить и закрыть
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryFlow;
