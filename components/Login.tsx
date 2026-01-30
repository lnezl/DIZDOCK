
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-10 bg-slate-900/40 border border-slate-800 rounded-[3.5rem] backdrop-blur-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center text-primary-500 mb-6 shadow-2xl shadow-primary-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Arcane Architect</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Авторизация системы</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Идентификатор</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full bg-slate-950/50 border-2 rounded-2xl px-6 py-4 outline-none transition-all text-white font-bold placeholder-slate-800 ${error ? 'border-rose-500/50' : 'border-slate-800 focus:border-primary-500/50'}`}
              placeholder="Login"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Ключ доступа</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-slate-950/50 border-2 rounded-2xl px-6 py-4 outline-none transition-all text-white font-bold placeholder-slate-800 ${error ? 'border-rose-500/50' : 'border-slate-800 focus:border-primary-500/50'}`}
              placeholder="Password"
              required
            />
          </div>

          {error && (
            <p className="text-rose-500 text-[10px] font-bold text-center animate-bounce">Доступ отклонен: Неверные данные</p>
          )}

          <button 
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary-600/20 uppercase tracking-widest text-xs active:scale-95"
          >
            Войти в систему
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
