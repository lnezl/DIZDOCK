
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (user: string, pass: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(username, password)) {
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-unity-dark select-none">
      <div className="w-full max-w-sm p-8 bg-unity-panel border border-unity-stroke rounded-sm shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-unity-accent rounded flex items-center justify-center text-white mb-6 shadow-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/></svg>
          </div>
          <h1 className="text-xl font-bold text-unity-text tracking-tight mb-1">Unity Architect</h1>
          <p className="text-[10px] font-bold text-unity-dim uppercase tracking-[0.2em]">Только авторизованный доступ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="inspector-label ml-1">Идентификатор</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`unity-input w-full py-2 ${error ? 'border-rose-500/50' : ''}`}
              placeholder="Логин"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="inspector-label ml-1">Ключ Доступа</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`unity-input w-full py-2 ${error ? 'border-rose-500/50' : ''}`}
              placeholder="Пароль"
              required
            />
          </div>

          {error && (
            <p className="text-rose-500 text-[10px] font-bold text-center uppercase tracking-tighter">Отказ: Неверные данные</p>
          )}

          <div className="pt-4">
            <button 
              type="submit"
              className="unity-button-primary w-full py-2 text-xs font-bold uppercase tracking-widest shadow-md"
            >
              Инициализировать Workspace
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-unity-dim font-bold uppercase tracking-widest">Enterprise Edition v2.5.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
