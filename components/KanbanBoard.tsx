
import React, { useState, useRef, useEffect } from 'react';
import { GameProject, Task, TaskStatus, TaskPriority, ChecklistItem, TaskComment } from '../types';

interface KanbanBoardProps {
  project: GameProject;
  onUpdate: (project: GameProject) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ project, onUpdate }) => {
  const [isAdding, setIsAdding] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

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

  const addTask = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(), title: newTaskTitle, description: '', status, priority: 'normal',
      progress: 0, checklist: [], comments: [], attachments: []
    };
    onUpdate({ ...project, tasks: [...(project.tasks || []), newTask] });
    setNewTaskTitle('');
    setIsAdding(null);
  };

  const updateTask = (updatedTask: Task) => {
    const updatedTasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    onUpdate({ ...project, tasks: updatedTasks });
  };

  const editingTask = project.tasks.find(t => t.id === editingTaskId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingTask) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateTask({ ...editingTask, attachments: [...(editingTask.attachments || []), base64] });
      };
      reader.readAsDataURL(file);
    }
  };

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

  const addComment = () => {
    if (newComment.trim() && editingTask) {
      const comment: TaskComment = { id: crypto.randomUUID(), text: newComment, timestamp: Date.now() };
      updateTask({ ...editingTask, comments: [comment, ...editingTask.comments] });
      setNewComment('');
    }
  };

  const renderColumn = (status: TaskStatus, title: string, color: string) => {
    const tasks = (project.tasks || []).filter(t => t.status === status);
    const isOver = dragOverStatus === status;
    return (
      <div 
        className={`flex flex-col w-[280px] md:w-72 shrink-0 rounded-[1.5rem] md:rounded-[2rem] p-4 h-full border transition-all ${
          isOver ? 'bg-primary-500/10 border-primary-500/30' : 'bg-slate-900/30 border-slate-800/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
        onDragLeave={() => setDragOverStatus(null)}
        onDrop={(e) => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('taskId');
          if (taskId) onUpdate({ ...project, tasks: project.tasks.map(t => t.id === taskId ? { ...t, status } : t) });
          setDragOverStatus(null);
        }}
      >
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4 px-2">
          <span className={`w-2 h-2 rounded-full ${color}`} /> {title} <span className="opacity-30">({tasks.length})</span>
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 no-scrollbar min-h-[300px]">
          {tasks.map(task => (
            <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)} onClick={() => setEditingTaskId(task.id)} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl shadow-xl hover:border-primary-500/30 transition-all cursor-grab active:cursor-grabbing">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>{task.priority}</span>
                <span className="text-[9px] font-mono text-primary-500 font-bold">{task.progress}%</span>
              </div>
              <p className="text-[13px] text-slate-200 font-bold leading-tight">{task.title}</p>
            </div>
          ))}
          {isAdding === status ? (
            <div className="bg-slate-950 p-4 rounded-xl border-2 border-primary-500/50">
              <input autoFocus value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask(status)} className="w-full bg-transparent text-xs text-white outline-none mb-3 font-bold" placeholder="Задача..." />
              <div className="flex gap-2"><button onClick={() => addTask(status)} className="flex-1 bg-primary-600 text-white text-[8px] font-black uppercase py-2 rounded-lg">OK</button></div>
            </div>
          ) : (
            <button onClick={() => setIsAdding(status)} className="w-full py-3 rounded-xl text-slate-600 border border-dashed border-slate-800/50 text-[9px] font-black uppercase">+ Добавить</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 md:mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Производство</h2>
      </div>
      <div className="flex gap-4 md:gap-6 h-[calc(100%-80px)] items-start overflow-x-auto no-scrollbar pb-10 -mx-4 px-4 md:mx-0 md:px-0">
        {renderColumn('backlog', 'Бэклог', 'bg-slate-700')}
        {renderColumn('todo', 'В плане', 'bg-sky-500')}
        {renderColumn('doing', 'В работе', 'bg-primary-500')}
        {renderColumn('done', 'Готово', 'bg-emerald-500')}
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 p-0 md:p-4 overflow-y-auto" onClick={() => setEditingTaskId(null)}>
          <div className="bg-slate-900 border border-slate-800 w-full md:max-w-4xl min-h-screen md:min-h-0 md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative my-auto overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 md:mb-8">
              <input className="bg-transparent text-2xl md:text-3xl font-black text-white outline-none w-full mr-4" value={editingTask.title} onChange={e => updateTask({ ...editingTask, title: e.target.value })} />
              <button onClick={() => setEditingTaskId(null)} className="p-2 md:p-3 bg-slate-800 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 min-h-[100px] resize-none" value={editingTask.description} placeholder="Описание..." onChange={e => updateTask({ ...editingTask, description: e.target.value })} />
                <div className="space-y-3">
                  {editingTask.checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                      <button onClick={() => toggleChecklistItem(item.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}>{item.completed && '✓'}</button>
                      <span className={`text-xs ${item.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{item.text}</span>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white" value={newChecklistItem} placeholder="Новый пункт..." onChange={e => setNewChecklistItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChecklistItem()} />
                    <button onClick={addChecklistItem} className="bg-slate-800 px-4 rounded-lg text-white">+</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                 <button onClick={() => { if (confirm('Удалить?')) { onUpdate({ ...project, tasks: project.tasks.filter(t => t.id !== editingTask.id) }); setEditingTaskId(null); } }} className="w-full py-3 border-2 border-rose-500/30 text-rose-500 rounded-xl text-[10px] font-black uppercase">Удалить задачу</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
