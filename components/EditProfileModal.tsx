import React, { useState } from 'react';
import { User } from '../types';
import { X, Save, User as UserIcon, Link, Image as ImageIcon, Palette, History, EyeOff } from 'lucide-react';

interface EditProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onSave: (updates: Partial<User>) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ currentUser, onClose, onSave, showToast }) => {
  const [displayName] = useState(currentUser.displayName);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(currentUser.profileBannerUrl || '');
  
  const [preferences, setPreferences] = useState(currentUser.preferences || { trackHistory: true });
  const [commentStyle, setCommentStyle] = useState(currentUser.commentStyle || {});
  
  const isVip = currentUser.tier === 'Vip';
  const isSVip = currentUser.tier === 'SVip';
  const isPremium = isVip || isSVip;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast("Tên hiển thị không được để trống.", 'error');
      return;
    }
    // Basic URL validation
    try { new URL(avatarUrl); } catch (_) {
      showToast("URL ảnh đại diện không hợp lệ.", 'error'); return;
    }
    if(isPremium && bannerUrl) {
      try { new URL(bannerUrl); } catch (_) {
        showToast("URL ảnh bìa không hợp lệ.", 'error'); return;
      }
    }
    onSave({ displayName, avatarUrl, profileBannerUrl: bannerUrl, preferences, commentStyle });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-amber-500/10 w-full max-w-lg p-8 animate-fade-in-down max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Chỉnh sửa hồ sơ</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <img src={avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${currentUser.id}`} alt="Avatar Preview" className="w-20 h-20 rounded-full object-cover border-2 border-amber-500" onError={(e) => e.currentTarget.src = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${currentUser.id}`}/>
            <div className="flex-grow">
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><Link className="h-4 w-4" />URL Ảnh đại diện *</label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition"
                placeholder="https://example.com/avatar.png"
                required
              />
            </div>
          </div>

          {isPremium && (
             <div>
                <label htmlFor="bannerUrl" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><ImageIcon className="h-4 w-4" />URL Ảnh bìa (VIP/SVIP)</label>
                <input
                    id="bannerUrl"
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition"
                    placeholder="https://example.com/banner.png"
                />
             </div>
          )}
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><UserIcon className="h-4 w-4" />Tên hiển thị</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed"
              readOnly
              disabled
            />
            <p className="text-xs text-slate-500 mt-2">Tên hiển thị không thể thay đổi.</p>
          </div>

          {isPremium && (
            <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/10">
                <h3 className="font-semibold text-lg text-amber-400 flex items-center gap-2"><Palette className="h-5 w-5"/> Tùy chỉnh bình luận</h3>
                {isVip && !isSVip && (
                    <div>
                        <label htmlFor="commentColor" className="block text-sm font-medium text-slate-300 mb-2">Màu tên (VIP)</label>
                        <div className="flex items-center gap-3">
                           <input id="commentColor" type="color" value={commentStyle?.color || '#38bdf8'} onChange={e => setCommentStyle({ color: e.target.value })} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"/>
                           <p className="text-sm font-bold" style={{color: commentStyle?.color || '#38bdf8'}}>{currentUser.displayName}</p>
                        </div>
                    </div>
                )}
                {isSVip && (
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Màu tên Gradient (SVIP)</label>
                        <div className="flex items-center gap-3">
                           <input type="color" value={commentStyle?.gradient?.from || '#ec4899'} onChange={e => setCommentStyle({ gradient: { ...commentStyle.gradient, from: e.target.value } })} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"/>
                           <input type="color" value={commentStyle?.gradient?.to || '#f9a8d4'} onChange={e => setCommentStyle({ gradient: { ...commentStyle.gradient, to: e.target.value } })} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"/>
                           <p className="text-sm font-bold" style={{ background: `linear-gradient(to right, ${commentStyle?.gradient?.from || '#ec4899'}, ${commentStyle?.gradient?.to || '#f9a8d4'})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{currentUser.displayName}</p>
                        </div>
                    </div>
                )}
            </div>
          )}

           {isSVip && (
            <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/10">
                <h3 className="font-semibold text-lg text-amber-400 flex items-center gap-2"><EyeOff className="h-5 w-5"/> Tùy chỉnh riêng tư</h3>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-slate-200">Bật/Tắt lịch sử xem</span>
                    <div className="relative">
                        <input type="checkbox" checked={preferences.trackHistory} onChange={e => setPreferences({ trackHistory: e.target.checked })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </div>
                </label>
            </div>
          )}

          <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black py-3 rounded-lg font-semibold hover:from-amber-400 hover:to-orange-400 transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
            <Save className="h-5 w-5"/>
            Lưu thay đổi
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;