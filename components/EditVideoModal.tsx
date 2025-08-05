
import React, { useState } from 'react';
import { Video } from '../types';
import { X, Save, KeyRound } from 'lucide-react';

interface EditVideoModalProps {
  video: Video;
  onClose: () => void;
  onSave: (videoId: number, updates: Partial<Video>) => void;
}

const EditVideoModal: React.FC<EditVideoModalProps> = ({ video, onClose, onSave }) => {
  const [title, setTitle] = useState(video.title);
  const [tier, setTier] = useState(video.tier);
  const [password, setPassword] = useState(video.password || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!title.trim()) {
        alert("Title cannot be empty.");
        setLoading(false);
        return;
    }

    if ((tier === 'Vip' || tier === 'SVip') && !password.trim()) {
        alert("Password is required for VIP/SVIP tiers.");
        setLoading(false);
        return;
    }

    const updates: Partial<Video> = {
        title: title.trim(),
        tier,
        password: password.trim() ? password.trim() : undefined,
    };
    
    onSave(video.id, updates);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-fade-in-down" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Video</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400 outline-none transition"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tier</label>
            <div className="flex gap-2">
              {(['Normal', 'Vip', 'SVip'] as const).map(t => (
                <button 
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${tier === t ? 'bg-amber-500 text-black shadow' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {(tier === 'Vip' || tier === 'SVip') && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-slate-400" />
                Password
              </label>
              <input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400 outline-none transition"
                placeholder="Enter password for protected content"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
             <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white/10 text-slate-300 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg font-semibold hover:from-amber-400 hover:to-orange-400 transition-all duration-300 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="h-5 w-5"/>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVideoModal;