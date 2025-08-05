import React from 'react';
import { Play, FileVideo, BadgeCheck, Lock, Link as LinkIcon, Star, Award, Eye, Crown, Pin } from 'lucide-react';
import { Video, User } from '../types';

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  onViewProfile?: (userId: number) => void;
  isUserView?: boolean;
  currentUser: User | null;
  children?: React.ReactNode;
  isAdminReviewing?: boolean;
  isPinned?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay, onViewProfile, isUserView = false, currentUser, isPinned }) => {
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(onViewProfile) onViewProfile(video.uploaderId);
  }

  const canBypassPassword = currentUser && (
      (video.tier === 'SVip' && currentUser.tier === 'SVip') ||
      (video.tier === 'Vip' && (currentUser.tier === 'Vip' || currentUser.tier === 'SVip'))
  );

  const isProtected = isUserView && (video.tier === 'Vip' || video.tier === 'SVip') && video.password && !canBypassPassword;
  
  // Admin Panel card style
  if (!isUserView) { 
    return (
        <div className="aspect-video bg-slate-800 relative overflow-hidden cursor-pointer group rounded-lg" onClick={() => onPlay(video)}>
            {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900"><FileVideo className="h-12 w-12 text-slate-600" /></div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all duration-300">
               <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300 drop-shadow-lg" />
            </div>
        </div>
    );
  }

  // User View card style (completely redesigned)
  return (
    <div className="flex flex-col group cursor-pointer" onClick={() => onPlay(video)}>
      <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden relative mb-3 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-amber-500/10 group-hover:-translate-y-1">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><FileVideo className="h-16 w-16 text-slate-600" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 transition-all duration-300 group-hover:from-black/30"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-3 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <Play className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
        </div>

        {isProtected && (<div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm"><Lock className="h-4 w-4 text-white" /></div>)}

        {video.tier === 'Vip' && <div className="absolute top-2 left-2 bg-sky-500/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-lg"><Award className="h-3.5 w-3.5" /> VIP</div>}
        {video.tier === 'SVip' && <div className="absolute top-2 left-2 bg-yellow-400/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-black flex items-center gap-1 shadow-lg"><Star className="h-3.5 w-3.5" /> SVIP</div>}
        {isPinned && <div className="absolute bottom-2 left-2 bg-amber-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-black flex items-center gap-1.5 shadow-lg"><Pin className="h-3.5 w-3.5"/> Pinned</div>}
      </div>
      
      <div className="px-1 flex gap-3">
        <div className="relative flex-shrink-0 mt-0.5">
           <button onClick={handleProfileClick} className="w-9 h-9 rounded-full overflow-hidden bg-slate-700">
             <img src={video.uploaderAvatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${video.uploaderId}`} alt={video.uploaderName} />
           </button>
            {video.uploaderId === 0 ? (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2" title="Admin">
                    <Crown className="h-4 w-4 text-yellow-400" style={{ filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.7))' }} />
                </div>
            ) : video.tier === 'SVip' ? (
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full text-[9px] font-bold text-white border border-slate-900 svip-badge-glow" title="SVIP User">
                    SVIP
                </div>
            ) : video.tier === 'Vip' ? (
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full text-[9px] font-bold text-white border border-slate-900 vip-badge-glow" title="VIP User">
                    VIP
                </div>
            ) : null}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">{video.title}</h3>
          <div className="text-sm text-slate-400 mt-1">
              <div className="flex items-center gap-1.5 hover:text-white w-fit" onClick={handleProfileClick}>
                  <span>{video.uploaderName}</span>
                  {video.isUploaderVerified && <BadgeCheck className="h-4 w-4 text-blue-400" />}
              </div>
              <p className="text-slate-500 flex items-center gap-1.5">{video.views.toLocaleString('vi-VN')} lượt xem <span className="text-slate-600">·</span> {video.uploadDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;