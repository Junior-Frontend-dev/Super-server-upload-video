import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { LogIn, UserPlus, Settings, Upload, LogOut, X, User as UserIcon, Lock, Edit, Award, Star, Crown, Gem } from 'lucide-react';

interface UserAuthProps {
  currentUser: User | null;
  onRegister: (username: string, password: string) => Promise<boolean>;
  onLogin: (username: string, password: string) => Promise<boolean>;
  onLogout: () => void;
  onOpenUpload: () => void;
  onViewProfile: (userId: number) => void;
  onSwitchToAdminView: () => void;
  onShowBenefits: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AuthModal: React.FC<{
  mode: 'login' | 'register';
  onClose: () => void;
  onSubmit: (username: string, password: string) => Promise<boolean>;
}> = ({ mode, onClose, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSubmit(username, password);
    setLoading(false);
    if (success) onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 pt-[15vh] backdrop-blur-md">
      <div ref={modalRef} className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-amber-500/10 w-full max-w-sm p-8 relative animate-fade-in-down">
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X className="h-5 w-5" /></button>
        <h2 className="text-2xl font-bold text-white text-center mb-6">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><input type="text" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 outline-none transition" /></div>
          <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 outline-none transition" /></div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black py-3 rounded-lg font-semibold hover:from-amber-400 hover:to-orange-400 transition-all duration-300 shadow-lg disabled:opacity-50">{loading ? '...' : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký')}</button>
        </form>
      </div>
    </div>
  );
};

const UserAuth: React.FC<UserAuthProps> = ({ currentUser, onRegister, onLogin, onLogout, onOpenUpload, onSwitchToAdminView, onViewProfile, onShowBenefits, showToast }) => {
  const [modalMode, setModalMode] = useState<'login' | 'register' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (currentUser) {
    const isAdmin = currentUser.username === 'admin';
    return (
      <div className="flex items-center gap-3 relative" ref={menuRef}>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 text-white pl-2 pr-4 py-1.5 rounded-full hover:border-amber-500/50 hover:bg-white/10 transition-colors">
            <div className="relative">
                <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-8 h-8 rounded-full object-cover" />
                {isAdmin ? (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2" title="Admin">
                        <Crown className="h-4 w-4 text-yellow-400" style={{ filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.7))' }} />
                    </div>
                ) : currentUser.tier === 'SVip' ? (
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full text-[9px] font-bold text-white border border-slate-800 svip-badge-glow" title="SVIP User">
                        SVIP
                    </div>
                ) : currentUser.tier === 'Vip' ? (
                     <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full text-[9px] font-bold text-white border border-slate-800 vip-badge-glow" title="VIP User">
                        VIP
                    </div>
                ) : null}
            </div>
            <span className="font-semibold">{currentUser.displayName}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg py-2 z-20 animate-fade-in-down">
              {!isAdmin && <button onClick={() => { onViewProfile(currentUser.id); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"><UserIcon className="h-4 w-4" /> Trang cá nhân</button>}
              <button onClick={() => { onOpenUpload(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"><Upload className="h-4 w-4" /> Upload</button>
              <button onClick={() => { onShowBenefits(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"><Gem className="h-4 w-4" /> Quyền lợi Hạng</button>
              {isAdmin && (
                <>
                  <div className="my-1 h-px bg-white/10"></div>
                  <button onClick={() => { onSwitchToAdminView(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"><Settings className="h-4 w-4" /> Admin Panel</button>
                </>
              )}
               <div className="my-1 h-px bg-white/10"></div>
              <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors"><LogOut className="h-4 w-4" /> Đăng xuất</button>
            </div>
          )}
        </div>
        {modalMode && <AuthModal mode={modalMode} onClose={() => setModalMode(null)} onSubmit={modalMode === 'login' ? onLogin : onRegister} />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setModalMode('login')} className="px-5 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 font-semibold"><LogIn className="h-5 w-5" /> Đăng nhập</button>
      <button onClick={() => setModalMode('register')} className="px-5 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-amber-500/20"><UserPlus className="h-5 w-5" /> Đăng ký</button>
      {modalMode && <AuthModal mode={modalMode} onClose={() => setModalMode(null)} onSubmit={modalMode === 'login' ? onLogin : onRegister} />}
    </div>
  );
};

export default UserAuth;