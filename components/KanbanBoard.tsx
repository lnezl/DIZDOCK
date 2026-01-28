
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

  // Reminder Checker Logic
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      let hasUpdates = false;
      const updatedTasks = project.tasks.map(task => {
        if (task.reminder && task.reminder <= now && !task.reminderSent && task.status !== 'done') {
          // Trigger Notification
          alert(`Напоминание: ${task.title}`);
          hasUpdates = true;
          return { ...task, reminderSent: true };
        }
        return task;
      });

      if (hasUpdates) {
        onUpdate({ ...project, tasks: updatedTasks });
      }
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [project, onUpdate]);

  const addTask = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      description: '',
      status,
      priority: 'normal',
      progress: 0,
      checklist: [],
      comments: [],
      attachments: []
    };
    onUpdate({
      ...project,
      tasks: [...(project.tasks || []), newTask]
    });
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
        updateTask({
          ...editingTask,
          attachments: [...(editingTask.attachments || []), base64]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim() && editingTask) {
      const item: ChecklistItem = { id: crypto.randomUUID(), text: newChecklistItem, completed: false };
      updateTask({
        ...editingTask,
        checklist: [...editingTask.checklist, item]
      });
      setNewChecklistItem('');
    }
  };

  const toggleChecklistItem = (id: string) => {
    if (editingTask) {
      const newChecklist = editingTask.checklist.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      // Авто-прогресс
      const completed = newChecklist.filter(i => i.completed).length;
      const progress = Math.round((completed / newChecklist.length) * 100);
      updateTask({ ...editingTask, checklist: newChecklist, progress });
    }
  };

  const addComment = () => {
    if (newComment.trim() && editingTask) {
      const comment: TaskComment = { id: crypto.randomUUID(), text: newComment, timestamp: Date.now() };
      updateTask({
        ...editingTask,
        comments: [comment, ...editingTask.comments]
      });
      setNewComment('');
    }
  };

  const formatReminderDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  const renderColumn = (status: TaskStatus, title: string, color: string) => {
    const tasks = (project.tasks || []).filter(t => t.status === status);
    const isOver = dragOverStatus === status;
    
    return (
      <div 
        className={`flex flex-col w-72 min-w-[280px] rounded-[2rem] p-4 h-full border transition-all ${
          isOver ? 'bg-primary-500/10 border-primary-500/30' : 'bg-slate-900/30 border-slate-800/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
        onDragLeave={() => setDragOverStatus(null)}
        onDrop={(e) => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('taskId');
          if (taskId) {
            onUpdate({
              ...project,
              tasks: project.tasks.map(t => t.id === taskId ? { ...t, status } : t)
            });
          }
          setDragOverStatus(null);
        }}
      >
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_currentColor]`} />
            {title}
            <span className="opacity-30">({tasks.length})</span>
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar min-h-[300px]">
          {tasks.map(task => {
            const isReminderOverdue = task.reminder && task.reminder < Date.now() && task.status !== 'done';
            
            return (
              <div 
                key={task.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                onClick={() => setEditingTaskId(task.id)}
                className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-xl hover:border-primary-500/30 transition-all cursor-grab active:cursor-grabbing group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${
                    task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {task.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    {task.reminder && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={isReminderOverdue ? "text-rose-500" : "text-primary-500"}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    )}
                    <span className="text-[9px] font-mono text-primary-500 font-bold">{task.progress}%</span>
                  </div>
                </div>
                <p className="text-[13px] text-slate-200 font-bold leading-tight mb-3 group-hover:text-white">{task.title}</p>
                
                <div className="flex items-center gap-3 pt-3 border-t border-slate-800/50 text-[10px] text-slate-600 font-bold">
                   {task.attachments && task.attachments.length > 0 && (
                     <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      {task.attachments.length}
                     </div>
                   )}
                   {task.checklist && task.checklist.length > 0 && (
                     <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                     </div>
                   )}
                   {task.comments && task.comments.length > 0 && (
                     <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {task.comments.length}
                     </div>
                   )}
                </div>
              </div>
            );
          })}

          {isAdding === status ? (
            <div className="bg-slate-950 p-4 rounded-2xl border-2 border-primary-500/50 shadow-2xl">
              <input 
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask(status); }}
                className="w-full bg-transparent text-xs text-white outline-none mb-3 font-bold"
                placeholder="Что нужно сделать?"
              />
              <div className="flex gap-2">
                <button onClick={() => addTask(status)} className="flex-1 bg-primary-600 text-white text-[8px] font-black uppercase py-2 rounded-lg">Создать</button>
                <button onClick={() => setIsAdding(null)} className="text-slate-500 text-[8px] font-black uppercase px-2">X</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(status)}
              className="w-full py-4 rounded-2xl text-slate-600 hover:text-primary-400 hover:bg-primary-500/5 transition-all text-[9px] font-black uppercase tracking-widest border-2 border-dashed border-slate-800/50"
            >
              + Добавить задачу
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tighter">Производство</h2>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Организация хаоса в результат</p>
      </div>
      
      <div className="flex gap-6 h-[calc(100%-120px)] items-start overflow-x-auto no-scrollbar pb-10">
        {renderColumn('backlog', 'Идеи / Бэклог', 'bg-slate-700')}
        {renderColumn('todo', 'План на спринт', 'bg-sky-500')}
        {renderColumn('doing', 'В разработке', 'bg-primary-500')}
        {renderColumn('done', 'Готово', 'bg-emerald-500')}
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 overflow-y-auto" onClick={() => setEditingTaskId(null)}>
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1 mr-8">
                <input 
                  className="bg-transparent text-3xl font-black text-white outline-none w-full border-b border-transparent focus:border-primary-500/30 pb-2"
                  value={editingTask.title}
                  onChange={e => updateTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <button onClick={() => setEditingTaskId(null)} className="p-3 bg-slate-800 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Левая колонка - настройки и описание */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Описание задачи</label>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm text-slate-300 outline-none focus:border-primary-500/50 min-h-[120px] resize-none"
                    value={editingTask.description}
                    placeholder="Детали реализации, технические требования..."
                    onChange={e => updateTask({ ...editingTask, description: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Чек-лист прогресса</label>
                    <span className="text-primary-500 font-black text-xs">{editingTask.progress}%</span>
                  </div>
                  <div className="space-y-3 mb-4">
                    {editingTask.checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <button 
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                            item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
                          }`}
                        >
                          {item.completed && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                        <span className={`text-xs ${item.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{item.text}</span>
                        <button 
                          onClick={() => updateTask({ ...editingTask, checklist: editingTask.checklist.filter(i => i.id !== item.id) })}
                          className="ml-auto text-slate-700 hover:text-rose-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-primary-500/50"
                      value={newChecklistItem}
                      placeholder="Добавить пункт..."
                      onChange={e => setNewChecklistItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                    />
                    <button onClick={addChecklistItem} className="bg-slate-800 text-slate-400 px-4 rounded-xl text-[10px] font-black uppercase">+</button>
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Референсы и Ассеты</label>
                   <div className="grid grid-cols-3 gap-4">
                     {editingTask.attachments?.map((src, i) => (
                       <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-800 relative group cursor-pointer" onClick={() => setViewingImage(src)}>
                         <img src={src} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                         <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTask({ ...editingTask, attachments: editingTask.attachments?.filter((_, idx) => idx !== i) });
                          }}
                          className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                         </button>
                       </div>
                     ))}
                     <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 hover:text-primary-400 hover:border-primary-500/50 transition-all"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                       <span className="text-[8px] font-black uppercase mt-2">Загрузить</span>
                     </button>
                     <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                   </div>
                </div>
              </div>

              {/* Правая колонка - метаданные и комментарии */}
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Настройки</label>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <span className="text-[8px] font-black text-slate-600 uppercase block mb-3">Приоритет</span>
                      <div className="flex gap-2">
                        {['low', 'normal', 'urgent'].map(p => (
                          <button 
                            key={p}
                            onClick={() => updateTask({ ...editingTask, priority: p as any })}
                            className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${
                              editingTask.priority === p 
                                ? 'bg-primary-600 border-primary-600 text-white' 
                                : 'border-slate-800 text-slate-600'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <span className="text-[8px] font-black text-slate-600 uppercase block mb-3">Напоминание</span>
                      <div className="space-y-3">
                        <input 
                          type="datetime-local"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-primary-500/50"
                          value={editingTask.reminder ? new Date(editingTask.reminder).toISOString().slice(0, 16) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateTask({ 
                              ...editingTask, 
                              reminder: val ? new Date(val).getTime() : undefined,
                              reminderSent: false 
                            });
                          }}
                        />
                        {editingTask.reminder && (
                          <button 
                            onClick={() => updateTask({ ...editingTask, reminder: undefined, reminderSent: false })}
                            className="w-full py-2 bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase rounded-lg border border-rose-500/20"
                          >
                            Сбросить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Журнал обсуждения</label>
                  <div className="space-y-4 mb-4 max-h-[200px] overflow-y-auto no-scrollbar pr-2">
                    {editingTask.comments.map(comment => (
                      <div key={comment.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                        <div className="flex justify-between mb-2">
                           <span className="text-[7px] font-black text-primary-500 uppercase">Архитектор</span>
                           <span className="text-[7px] text-slate-700">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-12 text-xs text-white outline-none focus:border-primary-500/50 h-24 resize-none"
                      placeholder="Написать комментарий..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <button 
                      onClick={addComment}
                      className="absolute right-3 bottom-3 p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (confirm('Удалить эту задачу?')) {
                      onUpdate({ ...project, tasks: project.tasks.filter(t => t.id !== editingTask.id) });
                      setEditingTaskId(null);
                    }
                  }}
                  className="w-full py-4 border-2 border-rose-500/30 text-rose-500 hover:bg-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                >
                  Удалить Задачу
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Полноэкранный просмотр референса */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-10 cursor-zoom-out"
          onClick={() => setViewingImage(null)}
        >
          <img src={viewingImage} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain animate-in zoom-in duration-300" />
          <button className="absolute top-10 right-10 text-white p-4 bg-white/10 rounded-full hover:bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
