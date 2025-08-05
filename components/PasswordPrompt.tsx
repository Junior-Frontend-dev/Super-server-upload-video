
import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PasswordPromptProps {
  videoTitle: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ videoTitle, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-amber-500/10 w-full max-w-sm p-8 animate-fade-in-down" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Lock className="text-amber-400" />
            Yêu cầu mật khẩu
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-slate-300 mb-2">Nội dung này được bảo vệ. Vui lòng nhập mật khẩu để xem:</p>
        <p className="text-amber-400 font-semibold text-lg mb-6 truncate">{videoTitle}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
              placeholder="Nhập mật khẩu..."
              autoFocus
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black py-3 rounded-lg font-semibold hover:from-amber-400 hover:to-orange-400 transition-all duration-300 shadow-lg hover:shadow-amber-500/20 transform hover:-translate-y-px">
            Mở khóa
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPrompt;