
import React, { useState, useRef, useEffect } from 'react';
import { GameProject, Task, TaskPriority, ChecklistItem, BoardColumn } from '../types';

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
    const colors = ['bg-slate-500', 'bg-sky-500', 'bg-unity-accent', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500'];
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

  const editingTask = project.tasks.find(t => t.id === editingTaskId);

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

    return (
      <div 
        key={column.id}
        className={`flex flex-col w-[280px] shrink-0 rounded-sm p-1.5 h-full transition-all border ${
          isOver ? 'bg-unity-panel border-unity-accent ring-1 ring-unity-accent' : 'bg-unity-panel border-unity-border'
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
        <div className="flex items-center justify-between mb-2 px-2 py-1 bg-unity-header/30 rounded-t-sm border-b border-unity-border group/colheader">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${column.color}`} />
            <h3 className="text-[10px] font-bold text-unity-dim uppercase tracking-wider truncate">
              {column.title}
            </h3>
            <span className="text-[9px] text-unity-stroke font-bold">[{tasks.length}]</span>
          </div>
          <button 
            onClick={() => deleteColumn(column.id)}
            className="opacity-0 group-hover/colheader:opacity-100 p-1 text-unity-stroke hover:text-rose-500 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar min-h-[400px] p-1 bg-unity-input/20">
          {tasks.map(task => (
            <div 
              key={task.id} 
              draggable 
              onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)} 
              onClick={() => setEditingTaskId(task.id)} 
              className="bg-unity-panel border border-unity-stroke p-3 rounded-sm shadow-sm hover:border-unity-accent/50 transition-all cursor-grab active:cursor-grabbing group/task relative"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className={`w-1 h-3 rounded-full ${task.priority === 'urgent' ? 'bg-rose-500' : 'bg-unity-stroke'}`} />
                <span className="text-[9px] font-mono text-unity-accent font-bold">{task.progress}%</span>
              </div>
              <p className="text-[12px] text-unity-text font-medium leading-snug group-hover/task:text-white transition-colors line-clamp-2">{task.title}</p>
              {task.checklist.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 opacity-40">
                   <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                   <span className="text-[8px] font-bold">{task.checklist.filter(c => c.completed).length}/{task.checklist.length}</span>
                </div>
              )}
            </div>
          ))}
          
          {isAddingTaskTo === column.id ? (
            <div className="bg-unity-panel p-3 rounded-sm border border-unity-accent shadow-xl animate-in fade-in slide-in-from-top-1">
              <input 
                autoFocus 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && addTask(column.id)} 
                className="w-full bg-unity-input border border-unity-border text-xs text-white outline-none mb-2 px-2 py-1 rounded-sm" 
                placeholder="Название задачи..." 
              />
              <div className="flex gap-1">
                <button onClick={() => setIsAddingTaskTo(null)} className="flex-1 bg-unity-stroke hover:bg-unity-hover text-[9px] font-bold uppercase py-1 rounded-sm">Отмена</button>
                <button onClick={() => addTask(column.id)} className="flex-1 bg-unity-accent text-white text-[9px] font-bold uppercase py-1 rounded-sm">Добавить</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingTaskTo(column.id)} 
              className="w-full py-2 rounded-sm text-unity-dim border border-dashed border-unity-stroke hover:bg-unity-hover hover:text-unity-text transition-all text-[9px] font-bold uppercase tracking-wider"
            >
              + Новая задача
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <svg className="w-5 h-5 text-unity-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>
           <h2 className="text-xl font-bold text-white tracking-tight">Console: Производство</h2>
        </div>
        <button 
          onClick={addColumn}
          className="unity-button-primary text-[10px] uppercase font-bold tracking-wider px-4 shadow-md"
        >
          Добавить Этап
        </button>
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar pb-6">
        <div className="flex gap-3 h-full items-start">
          {project.columns.map(renderColumn)}
          <div className="w-20 shrink-0" />
        </div>
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setEditingTaskId(null)}>
          <div className="bg-unity-panel border border-unity-stroke w-full max-w-2xl max-h-[85vh] rounded-sm shadow-2xl relative flex flex-col animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-unity-header px-4 py-2 border-b border-unity-border flex justify-between items-center">
               <span className="text-[10px] font-bold text-unity-dim uppercase">Inspector: Task Detail</span>
               <button onClick={() => setEditingTaskId(null)} className="text-unity-dim hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2.5"/></svg>
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-1">
                <label className="inspector-label">Название</label>
                <input className="unity-input w-full text-base font-bold" value={editingTask.title} onChange={e => updateTask({ ...editingTask, title: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="inspector-label">Описание</label>
                <textarea className="unity-input w-full h-32 resize-none" value={editingTask.description} placeholder="Опишите детали..." onChange={e => updateTask({ ...editingTask, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="inspector-label">Приоритет</label>
                  <select 
                    className="unity-input w-full"
                    value={editingTask.priority}
                    onChange={(e) => updateTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="inspector-label">Прогресс ({editingTask.progress}%)</label>
                  <div className="h-6 bg-unity-input border border-unity-border rounded-sm relative overflow-hidden">
                    <div className="h-full bg-unity-accent transition-all duration-300" style={{ width: `${editingTask.progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="inspector-label">Чек-лист</label>
                <div className="space-y-1.5">
                  {editingTask.checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group/checkitem">
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => toggleChecklistItem(item.id)}
                        className="w-3.5 h-3.5 rounded-sm border-unity-border bg-unity-input text-unity-accent focus:ring-0"
                      />
                      <span className={`text-xs flex-1 ${item.completed ? 'text-unity-stroke line-through' : 'text-unity-text'}`}>{item.text}</span>
                      <button onClick={() => updateTask({ ...editingTask, checklist: editingTask.checklist.filter(i => i.id !== item.id) })} className="opacity-0 group-hover/checkitem:opacity-100 text-rose-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeWidth="3"/></svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input className="unity-input flex-1 py-1" value={newChecklistItem} placeholder="Добавить пункт..." onChange={e => setNewChecklistItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (()=>{
                      if (newChecklistItem.trim()) {
                        const item: ChecklistItem = { id: crypto.randomUUID(), text: newChecklistItem, completed: false };
                        updateTask({ ...editingTask, checklist: [...editingTask.checklist, item] });
                        setNewChecklistItem('');
                      }
                    })()} />
                    <button onClick={()=>{
                       if (newChecklistItem.trim()) {
                        const item: ChecklistItem = { id: crypto.randomUUID(), text: newChecklistItem, completed: false };
                        updateTask({ ...editingTask, checklist: [...editingTask.checklist, item] });
                        setNewChecklistItem('');
                      }
                    }} className="unity-button px-3">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-unity-header px-6 py-3 border-t border-unity-border flex justify-between">
              <button 
                onClick={() => { if (confirm('Удалить эту задачу?')) { onUpdate({ ...project, tasks: project.tasks.filter(t => t.id !== editingTask.id) }); setEditingTaskId(null); } }} 
                className="text-rose-500 text-[10px] font-bold uppercase hover:underline"
              >
                Удалить задачу
              </button>
              <button onClick={() => setEditingTaskId(null)} className="unity-button-primary px-6">Готово</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
