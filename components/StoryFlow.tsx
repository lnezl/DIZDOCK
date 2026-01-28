
import React, { useState, useRef } from 'react';
import { GameProject, PlotNode, PlotChoice } from '../types';

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
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentFlow) return null;

  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 140;

  const updateCurrentFlow = (updatedFlow: any) => {
    onUpdate({
      ...project,
      storyFlows: project.storyFlows.map(f => f.id === flowId ? updatedFlow : f)
    });
  };

  const addNode = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / zoom - NODE_WIDTH / 2;
    const y = (e.clientY - rect.top) / zoom - 20;

    const newNode: PlotNode = {
      id: crypto.randomUUID(),
      title: 'Новая сцена',
      type: 'scene',
      content: '',
      choices: [],
      color: 'indigo',
      position: { x: Math.max(0, x), y: Math.max(0, y) }
    };
    updateCurrentFlow({ ...currentFlow, plotNodes: [...currentFlow.plotNodes, newNode] });
  };

  const updateNode = (updatedNode: PlotNode) => {
    updateCurrentFlow({
      ...currentFlow,
      plotNodes: currentFlow.plotNodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    });
  };

  const deleteConnection = (sourceNodeId: string, choiceId: string) => {
    const node = currentFlow.plotNodes.find(n => n.id === sourceNodeId);
    if (!node) return;
    const updatedChoices = node.choices.map(c => 
      c.id === choiceId ? { ...c, targetNodeId: null } : c
    );
    updateNode({ ...node, choices: updatedChoices });
  };

  const handleMouseDown = (e: React.MouseEvent, node: PlotNode) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.port')) return;
    e.stopPropagation();
    setDraggingNodeId(node.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - node.position.x,
      y: (e.clientY - rect.top) / zoom - node.position.y
    });
  };

  const handleStartConnect = (e: React.MouseEvent, node: PlotNode, choiceId: string) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = (e.clientX - rect.left) / zoom;
    const startY = (e.clientY - rect.top) / zoom;
    setConnecting({ sourceNodeId: node.id, choiceId, startX, startY, currentX: startX, currentY: startY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (draggingNodeId) {
      updateCurrentFlow({
        ...currentFlow,
        plotNodes: currentFlow.plotNodes.map(n => 
          n.id === draggingNodeId ? { ...n, position: { x: x - dragOffset.x, y: y - dragOffset.y } } : n
        )
      });
    }

    if (connecting) {
      setConnecting({ ...connecting, currentX: x, currentY: y });
      const hitNode = currentFlow.plotNodes.find(n => 
        n.id !== connecting.sourceNodeId &&
        x >= n.position.x && x <= n.position.x + NODE_WIDTH &&
        y >= n.position.y && y <= n.position.y + NODE_HEIGHT
      );
      setHoveredNodeId(hitNode?.id || null);
    }
  };

  const handleMouseUp = () => {
    if (connecting && hoveredNodeId) {
      const sourceNode = currentFlow.plotNodes.find(n => n.id === connecting.sourceNodeId);
      if (sourceNode) {
        const updatedChoices = sourceNode.choices.map(c => 
          c.id === connecting.choiceId ? { ...c, targetNodeId: hoveredNodeId } : c
        );
        updateNode({ ...sourceNode, choices: updatedChoices });
      }
    }
    setDraggingNodeId(null);
    setConnecting(null);
    setHoveredNodeId(null);
  };

  const renderConnections = () => {
    return currentFlow.plotNodes.flatMap(node => 
      node.choices.filter(c => c.targetNodeId).map(choice => {
        const target = currentFlow.plotNodes.find(n => n.id === choice.targetNodeId);
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
        const t = 0.5;
        const midX = Math.pow(1-t, 3)*startX + 3*Math.pow(1-t, 2)*t*cp1x + 3*(1-t)*Math.pow(t, 2)*cp2x + Math.pow(t, 3)*endX;
        const midY = Math.pow(1-t, 3)*startY + 3*Math.pow(1-t, 2)*t*cp1y + 3*(1-t)*Math.pow(t, 2)*cp2y + Math.pow(t, 3)*endY;

        return (
          <g key={`${node.id}-${choice.id}`} className="group/link">
            <path d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`} fill="none" stroke="transparent" strokeWidth="20" className="cursor-pointer" />
            <path d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`} fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="2.5" markerEnd="url(#arrowhead)" className="group-hover/link:stroke-indigo-400 group-hover/link:stroke-[4px] transition-all" />
            <g transform={`translate(${midX - 10}, ${midY - 10})`} className="opacity-0 group-hover/link:opacity-100 transition-opacity cursor-pointer" onClick={(e) => { e.stopPropagation(); deleteConnection(node.id, choice.id); }}>
              <circle r="10" cx="10" cy="10" className="fill-slate-900 stroke-rose-500 stroke-2" />
              <path d="M 7 7 L 13 13 M 13 7 L 7 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        );
      })
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">{currentFlow.name}</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Проектирование логики событий</p>
        </div>
        <div className="flex gap-4">
           <button onClick={(e) => addNode(e as any)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
             + Добавить Сцену
           </button>
        </div>
      </div>

      <div ref={containerRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onDoubleClick={addNode} className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-[2rem] relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: '5000px', height: '5000px' }} className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" /></marker></defs>
            {renderConnections()}
            {connecting && <path d={`M ${connecting.startX} ${connecting.startY} C ${connecting.startX + 100} ${connecting.startY}, ${connecting.currentX - 100} ${connecting.currentY}, ${connecting.currentX} ${connecting.currentY}`} fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5,5" className="animate-[dash_1s_linear_infinite]" />}
          </svg>

          {currentFlow.plotNodes.map((node) => (
            <div key={node.id} onMouseDown={(e) => handleMouseDown(e, node)} onDoubleClick={(e) => { e.stopPropagation(); setEditingNodeId(node.id); }} style={{ left: node.position.x, top: node.position.y, width: NODE_WIDTH, minHeight: NODE_HEIGHT }} className={`absolute z-10 p-4 rounded-2xl border-2 cursor-grab active:cursor-grabbing ${editingNodeId === node.id ? 'bg-indigo-600/20 border-indigo-500' : hoveredNodeId === node.id ? 'bg-amber-500/10 border-amber-500 scale-[1.02]' : 'bg-slate-900/90 border-slate-800'}`}>
              <h3 className="text-[11px] font-black text-white mb-1 truncate">{node.title}</h3>
              <p className="text-[9px] text-slate-500 line-clamp-2 mb-3">{node.content || '...'}</p>
              <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                 {node.choices.map((choice) => (
                   <div key={choice.id} className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-400 truncate max-w-[140px]">{choice.text}</span>
                      <div onMouseDown={(e) => handleStartConnect(e, node, choice.id)} className={`port w-3 h-3 rounded-full border-2 ${choice.targetNodeId ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-800 border-slate-700'}`} />
                   </div>
                 ))}
              </div>
              <button onClick={(e) => { e.stopPropagation(); setEditingNodeId(node.id); }} className="mt-3 text-[7px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-2 py-1 rounded block ml-auto">Редактировать</button>
            </div>
          ))}
        </div>
      </div>

      {editingNodeId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4" onClick={() => setEditingNodeId(null)}>
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            {(() => {
              const node = currentFlow.plotNodes.find(n => n.id === editingNodeId)!;
              return (
                <div className="space-y-6">
                  <input className="bg-transparent text-xl font-black text-white outline-none w-full border-b border-slate-800 pb-2" value={node.title} onChange={e => updateNode({ ...node, title: e.target.value })} />
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none h-32 resize-none" value={node.content} onChange={e => updateNode({ ...node, content: e.target.value })} placeholder="Описание..." />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><label className="text-[10px] text-slate-500 font-black uppercase">Выборы</label><button onClick={() => {
                      const newChoice = { id: crypto.randomUUID(), text: 'Новый выбор', targetNodeId: null };
                      updateNode({ ...node, choices: [...node.choices, newChoice] });
                    }} className="text-indigo-400 text-[10px]">+</button></div>
                    {node.choices.map((c, i) => (
                      <div key={c.id} className="flex gap-2">
                        <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-white" value={c.text} onChange={e => {
                          const newChoices = [...node.choices];
                          newChoices[i].text = e.target.value;
                          updateNode({ ...node, choices: newChoices });
                        }} />
                        <button onClick={() => updateNode({ ...node, choices: node.choices.filter(item => item.id !== c.id) })} className="text-rose-500">×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setEditingNodeId(null)} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-[10px] uppercase">Закрыть</button>
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
