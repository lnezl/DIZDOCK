
import React, { useState, useRef, useEffect } from 'react';
import { GameProject, Task, TaskPriority, ChecklistItem, TaskComment, BoardColumn } from '../types';

interface KanbanBoardProps {
  project: GameProject;
  onUpdate: (project: GameProject) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ project, onUpdate }) => {
  const [isAddingTaskTo, setIsAddingTaskTo] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      let hasUpdates = false;
      const updatedTasks = project.tasks.map(task => {
        if (task.reminder && task.reminder <= now && !task.reminderSent && task.status !== 'done') {
          alert(`Напоминание: ${task.title}`);
          hasUpdates = true;
          return { ...task, reminderSent: true };
        }
        return task;
      });
      if (hasUpdates) onUpdate({ ...project, tasks: updatedTasks });
    };
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [project, onUpdate]);

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(), 
      title: newTaskTitle, 
      description: '', 
      status: columnId, 
      priority: 'normal',
      progress: 0, 
      checklist: [], 
      comments: [], 
      attachments: []
    };
    onUpdate({ ...project, tasks: [...(project.tasks || []), newTask] });
    setNewTaskTitle('');
    setIsAddingTaskTo(null);
  };

  const updateTask = (updatedTask: Task) => {
    const updatedTasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    onUpdate({ ...project, tasks: updatedTasks });
  };

  const addColumn = () => {
    const colors = ['bg-slate-700', 'bg-sky-500', 'bg-primary-500', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newColumn: BoardColumn = {
      id: crypto.randomUUID(),
      title: 'Новый этап',
      color: randomColor
    };
    onUpdate({ ...project, columns: [...project.columns, newColumn] });
  };

  const deleteColumn = (columnId: string) => {
    if (confirm('Удалить колонку и все задачи в ней?')) {
      onUpdate({
        ...project,
        columns: project.columns.filter(c => c.id !== columnId),
        tasks: project.tasks.filter(t => t.status !== columnId)
      });
    }
  };

  const updateColumnTitle = (columnId: string, newTitle: string) => {
    onUpdate({
      ...project,
      columns: project.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c)
    });
  };

  const editingTask = project.tasks.find(t => t.id === editingTaskId);

  const addChecklistItem = () => {
    if (newChecklistItem.trim() && editingTask) {
      const item: ChecklistItem = { id: crypto.randomUUID(), text: newChecklistItem, completed: false };
      updateTask({ ...editingTask, checklist: [...editingTask.checklist, item] });
      setNewChecklistItem('');
    }
  };

  const toggleChecklistItem = (id: string) => {
    if (editingTask) {
      const newChecklist = editingTask.checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
      const completed = newChecklist.filter(i => i.completed).length;
      const progress = newChecklist.length > 0 ? Math.round((completed / newChecklist.length) * 100) : 0;
      updateTask({ ...editingTask, checklist: newChecklist, progress });
    }
  };

  const renderColumn = (column: BoardColumn) => {
    const tasks = (project.tasks || []).filter(t => t.status === column.id);
    const isOver = dragOverColumnId === column.id;
    const isEditing = editingColumnId === column.id;

    return (
      <div 
        key={column.id}
        className={`flex flex-col w-[300px] shrink-0 rounded-[2rem] p-5 h-full border transition-all ${
          isOver ? 'bg-primary-500/10 border-primary-500/30 ring-2 ring-primary-500/20' : 'bg-slate-900/40 border-slate-800/60'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOverColumnId(column.id); }}
        onDragLeave={() => setDragOverColumnId(null)}
        onDrop={(e) => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('taskId');
          if (taskId) onUpdate({ ...project, tasks: project.tasks.map(t => t.id === taskId ? { ...t, status: column.id } : t) });
          setDragOverColumnId(null);
        }}
      >
        <div className="flex items-center justify-between mb-5 px-1 group/colheader">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${column.color}`} />
            {isEditing ? (
              <input 
                autoFocus
                className="bg-slate-950 border border-primary-500/30 rounded px-2 py-0.5 text-[10px] font-black text-white outline-none w-full uppercase"
                value={column.title}
                onChange={(e) => updateColumnTitle(column.id, e.target.value)}
                onBlur={() => setEditingColumnId(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingColumnId(null)}
              />
            ) : (
              <h3 
                onClick={() => setEditingColumnId(column.id)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate cursor-text hover:text-white transition-colors"
              >
                {column.title} <span className="opacity-30 ml-1">({tasks.length})</span>
              </h3>
            )}
          </div>
          <button 
            onClick={() => deleteColumn(column.id)}
            className="opacity-0 group-hover/colheader:opacity-100 p-1 text-slate-600 hover:text-rose-500 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar min-h-[400px]">
          {tasks.map(task => (
            <div 
              key={task.id} 
              draggable 
              onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)} 
              onClick={() => setEditingTaskId(task.id)} 
              className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-primary-500/40 transition-all cursor-grab active:cursor-grabbing group/task"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>{task.priority}</span>
                <span className="text-[10px] font-mono text-primary-500 font-bold">{task.progress}%</span>
              </div>
              <p className="text-[14px] text-slate-200 font-bold leading-tight group-hover/task:text-white transition-colors">{task.title}</p>
            </div>
          ))}
          
          {isAddingTaskTo === column.id ? (
            <div className="bg-slate-950 p-5 rounded-2xl border-2 border-primary-500/50 shadow-2xl animate-in zoom-in duration-200">
              <input 
                autoFocus 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && addTask(column.id)} 
                className="w-full bg-transparent text-sm text-white outline-none mb-4 font-bold placeholder-slate-800" 
                placeholder="Что нужно сделать?" 
              />
              <div className="flex gap-2">
                <button onClick={() => setIsAddingTaskTo(null)} className="px-3 text-[9px] font-black text-slate-500 uppercase">Отмена</button>
                <button onClick={() => addTask(column.id)} className="flex-1 bg-primary-600 text-white text-[9px] font-black uppercase py-2.5 rounded-xl hover:bg-primary-500 transition-all">Добавить</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingTaskTo(column.id)} 
              className="w-full py-4 rounded-2xl text-slate-600 border border-dashed border-slate-800 hover:border-primary-500/30 hover:text-primary-400 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              + Добавить задачу
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="mb-10 flex items-center justify-between">
        <h2 className="text-4xl font-black text-white tracking-tighter">Производство</h2>
        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hidden md:block">
          Управляйте этапами и задачами вашего проекта
        </div>
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar pb-10">
        <div className="flex gap-8 h-full items-start px-1">
          {project.columns.map(renderColumn)}
          
          {/* Кнопка добавления новой колонки */}
          <button 
            onClick={addColumn}
            className="flex flex-col items-center justify-center w-[300px] shrink-0 rounded-[2rem] h-40 border-2 border-dashed border-slate-800 hover:border-primary-500/30 text-slate-700 hover:text-primary-500 transition-all group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center mb-4 group-hover:border-primary-500/50 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">Новый этап</span>
          </button>
          
          {/* Пустой блок в конце для отступа */}
          <div className="w-10 shrink-0" />
        </div>
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4" onClick={() => setEditingTaskId(null)}>
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[3rem] p-10 shadow-2xl relative overflow-y-auto no-scrollbar animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-10">
              <div className="flex-1">
                <input className="bg-transparent text-3xl font-black text-white outline-none w-full mb-2 tracking-tight" value={editingTask.title} onChange={e => updateTask({ ...editingTask, title: e.target.value })} />
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Статус:</span>
                  <select 
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-[10px] text-primary-400 font-black uppercase outline-none"
                    value={editingTask.status}
                    onChange={(e) => updateTask({ ...editingTask, status: e.target.value })}
                  >
                    {project.columns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => setEditingTaskId(null)} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl transition-all shadow-xl"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Описание задачи</label>
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 min-h-[150px] resize-none focus:border-primary-500/30 transition-all outline-none" value={editingTask.description} placeholder="Опишите детали..." onChange={e => updateTask({ ...editingTask, description: e.target.value })} />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Чек-лист прогресса</label>
                    <span className="text-[10px] font-mono text-primary-500">{editingTask.progress}%</span>
                  </div>
                  <div className="space-y-3">
                    {editingTask.checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 group/checkitem">
                        <button onClick={() => toggleChecklistItem(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-800 hover:border-emerald-500/50'}`}>
                          {item.completed && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                        <span className={`text-[13px] font-medium flex-1 ${item.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{item.text}</span>
                        <button onClick={() => updateTask({ ...editingTask, checklist: editingTask.checklist.filter(i => i.id !== item.id) })} className="opacity-0 group-hover/checkitem:opacity-100 text-rose-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                      </div>
                    ))}
                    <div className="flex gap-3 mt-4">
                      <input className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs text-white focus:border-primary-500/30 outline-none" value={newChecklistItem} placeholder="Добавить пункт..." onChange={e => setNewChecklistItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChecklistItem()} />
                      <button onClick={addChecklistItem} className="bg-slate-800 hover:bg-primary-600 px-6 rounded-2xl text-white transition-all font-black text-xl">+</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Приоритет</label>
                    <div className="flex gap-2">
                      {(['low', 'normal', 'urgent'] as TaskPriority[]).map(p => (
                        <button 
                          key={p} 
                          onClick={() => updateTask({ ...editingTask, priority: p })}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                            editingTask.priority === p 
                              ? (p === 'urgent' ? 'bg-rose-500 text-white border-rose-500' : 'bg-primary-500 text-white border-primary-500')
                              : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => { if (confirm('Удалить эту задачу навсегда?')) { onUpdate({ ...project, tasks: project.tasks.filter(t => t.id !== editingTask.id) }); setEditingTaskId(null); } }} 
                  className="w-full py-4 border-2 border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/5"
                >
                  Удалить задачу
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
