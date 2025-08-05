import React, { useState } from 'react';
import { User, Video } from '../types';
import { ArrowLeft, Edit, BadgeCheck, Video as VideoIcon, Award, Star, Clapperboard, Crown, Pin, History } from 'lucide-react';
import VideoCard from './VideoCard';

interface UserProfilePageProps {
  user: User;
  videos: Video[];
  historyVideos: Video[];
  currentUser: User | null;
  onPlayVideo: (video: Video) => void;
  onBack: () => void;
  onEditProfile: () => void;
  onPinVideo: (videoId: number) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ user, videos, historyVideos, currentUser, onPlayVideo, onBack, onEditProfile, onPinVideo }) => {
  const isOwnProfile = currentUser?.id === user.id;
  const isAdmin = user.username === 'admin';
  const canPin = isOwnProfile && (currentUser.tier === 'Vip' || currentUser.tier === 'SVip');
  const canViewHistory = isOwnProfile && (currentUser.tier === 'Vip' || currentUser.tier === 'SVip');

  const [activeTab, setActiveTab] = useState<'uploads' | 'history'>('uploads');

  const pinnedVideo = videos.find(v => v.id === user.pinnedVideoId);
  const otherVideos = videos.filter(v => v.id !== user.pinnedVideoId);

  const TabButton: React.FC<{ tab: 'uploads' | 'history', icon: React.ReactNode, label: string, count: number }> = ({ tab, icon, label, count }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-md transition-colors ${
            activeTab === tab ? 'bg-amber-500 text-black' : 'text-slate-300 hover:bg-white/10'
        }`}
    >
        {icon}
        {label}
        <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">{count}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a10] text-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <header className="mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold p-2 rounded-md hover:bg-white/5">
            <ArrowLeft className="h-5 w-5" />
            <span>QUAY LẠI</span>
          </button>
        </header>

        <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-12 min-h-[250px] flex items-end bg-slate-900">
            <div className="absolute inset-0">
                {user.profileBannerUrl ?
                    <img src={user.profileBannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700"></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] via-[#0a0a10]/50 to-transparent"></div>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 w-full">
                <div className="relative flex-shrink-0">
                    <img src={user.avatarUrl} alt={user.displayName} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-slate-800 shadow-lg" />
                     {isAdmin ? (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2" title="Admin">
                            <Crown className="h-8 w-8 text-yellow-400" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.7))' }} />
                        </div>
                    ) : user.tier === 'SVip' ? (
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full text-sm font-bold text-white border-2 border-slate-800 svip-badge-glow" title="SVIP User">
                            SVIP
                        </div>
                    ) : user.tier === 'Vip' ? (
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full text-sm font-bold text-white border-2 border-slate-800 vip-badge-glow" title="VIP User">
                            VIP
                        </div>
                    ) : null}
                </div>
                <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <h1 className="text-4xl md:text-5xl font-bold">{user.displayName}</h1>
                        {user.isVerified && <span title="Verified User"><BadgeCheck className="h-8 w-8 text-blue-400" /></span>}
                    </div>
                    <p className="text-slate-500 mt-2 text-lg">@{user.username}</p>
                    {isOwnProfile && (
                    <button onClick={onEditProfile} className="mt-4 bg-white/10 text-white px-5 py-2 rounded-full hover:bg-white/20 border border-white/10 flex items-center gap-2 mx-auto md:mx-0 font-semibold transition-colors">
                        <Edit className="h-4 w-4" /> Chỉnh sửa hồ sơ
                    </button>
                    )}
                </div>
            </div>
        </div>

        {pinnedVideo && (
            <div className="mb-12">
                 <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-amber-400">
                    <Pin className="h-6 w-6" />
                    Video đã ghim
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <VideoCard 
                      video={pinnedVideo} 
                      onPlay={onPlayVideo} 
                      isUserView={true} 
                      currentUser={currentUser}
                      isPinned
                    />
                </div>
                <div className="h-px bg-white/10 my-8"></div>
            </div>
        )}

        <div className="pb-8">
          <div className="flex items-center gap-4 mb-6">
              <TabButton tab="uploads" icon={<VideoIcon className="h-5 w-5"/>} label="Đã đăng" count={otherVideos.length} />
              {canViewHistory && <TabButton tab="history" icon={<History className="h-5 w-5"/>} label="Lịch sử xem" count={historyVideos.length} />}
          </div>
          
          {activeTab === 'uploads' && (
            otherVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                {otherVideos.map(video => (
                    <div key={video.id} className="relative">
                        <VideoCard 
                        video={video} 
                        onPlay={onPlayVideo} 
                        isUserView={true} 
                        currentUser={currentUser}
                        />
                        {canPin && (
                            <button onClick={() => onPinVideo(video.id)} className="absolute top-2 right-2 z-10 p-2 bg-black/40 rounded-full text-white hover:bg-amber-600 backdrop-blur-sm transition-colors" title="Ghim video này">
                                <Pin className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-black/10 rounded-xl border border-white/5">
                    <Clapperboard className="h-32 w-32 text-slate-700 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-slate-500">Chưa có video nào</h3>
                    <p className="text-slate-600 mt-2">{user.displayName} chưa đăng tải video nào.</p>
                </div>
            )
          )}

          {activeTab === 'history' && canViewHistory && (
             historyVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                    {historyVideos.map(video => (
                        <VideoCard 
                            key={`history-${video.id}`}
                            video={video} 
                            onPlay={onPlayVideo} 
                            isUserView={true} 
                            currentUser={currentUser}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-black/10 rounded-xl border border-white/5">
                    <History className="h-32 w-32 text-slate-700 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-slate-500">Lịch sử trống</h3>
                    <p className="text-slate-600 mt-2">Các video bạn xem sẽ xuất hiện ở đây.</p>
                </div>
            )
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;