
import React, { useState } from 'react';
import { Search, Clapperboard, Megaphone, X, Sparkles, Link as LinkIcon, Image as ImageIcon, Video as VideoIcon, List } from 'lucide-react';
import { Video, User } from '../types';
import VideoCard from './VideoCard';
import { FilterType } from '../App';

interface UserViewProps {
  videos: Video[];
  onPlayVideo: (video: Video) => void;
  onViewProfile: (userId: number) => void;
  currentUser: User | null;
  searchQuery: string;
  siteAnnouncement: string;
  isAiSearching: boolean;
  aiSearchResults: Video[] | null;
  filterType: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const AnnouncementBanner: React.FC<{ announcement: string }> = ({ announcement }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || !announcement) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-orange-500/80 to-amber-500/80 via-amber-600/80 text-white rounded-lg p-4 flex items-center justify-between gap-4 mb-8 max-w-screen-2xl mx-auto animate-fade-in-down shadow-lg shadow-amber-500/10 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <Megaphone className="h-6 w-6 flex-shrink-0 text-amber-300" />
                <p className="font-medium text-amber-50">{announcement}</p>
            </div>
            <button onClick={() => setIsVisible(false)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0">
                <X className="h-5 w-5" />
            </button>
        </div>
    );
};

const AiSearchLoader: React.FC = () => (
     <div className="mb-12 animate-fade-in-down">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-amber-400 animate-spin" />
            AI đang tìm kiếm...
        </h2>
        <div className="bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
            <div className="h-4 bg-slate-700/50 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-slate-700/50 rounded w-5/6 animate-pulse"></div>
        </div>
    </div>
);

const FilterChips: React.FC<{
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}> = ({ currentFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'Tất cả', icon: <List className="h-4 w-4" /> },
    { id: 'video', label: 'Video', icon: <VideoIcon className="h-4 w-4" /> },
    { id: 'image', label: 'Ảnh', icon: <ImageIcon className="h-4 w-4" /> },
    { id: 'link', label: 'Link', icon: <LinkIcon className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${
            currentFilter === filter.id
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          {filter.icon}
          {filter.label}
        </button>
      ))}
    </div>
  );
};


const UserView: React.FC<UserViewProps> = ({ videos, onPlayVideo, onViewProfile, currentUser, searchQuery, siteAnnouncement, isAiSearching, aiSearchResults, filterType, onFilterChange }) => {
  const noContent = videos.length === 0;

  const getTitle = () => {
    if (aiSearchResults !== null) {
      return `Kết quả từ AI cho: "${searchQuery}"`;
    }
    if (searchQuery) {
      return `Kết quả cho: "${searchQuery}"`;
    }
    switch(filterType) {
      case 'video': return 'Tất cả Video';
      case 'image': return 'Tất cả Ảnh';
      case 'link': return 'Tất cả Link';
      default: return 'Nội dung mới nhất';
    }
  };
  
  const NoResultsMessage = () => {
      if (aiSearchResults !== null) {
        return (
            <div className="text-center py-20 bg-black/10 rounded-xl border border-white/5">
                <Search className="h-32 w-32 text-slate-700 mx-auto mb-6" />
                <h3 className="text-3xl font-semibold text-slate-400 mb-4">AI không tìm thấy kết quả</h3>
                <p className="text-slate-500 text-lg">Không có nội dung nào trên V-Hub AI phù hợp với tìm kiếm của bạn.</p>
            </div>
        )
      }
      if (searchQuery) {
          return (
            <div className="text-center py-20 bg-black/10 rounded-xl border border-white/5">
                <Search className="h-32 w-32 text-slate-700 mx-auto mb-6" />
                <h2 className="text-3xl font-semibold text-slate-400 mb-4">Không tìm thấy kết quả</h2>
                <p className="text-slate-500 text-lg">Rất tiếc, không có nội dung nào phù hợp với từ khóa và bộ lọc của bạn.</p>
            </div>
          )
      }
      
      const emptyMessages = {
        all: { icon: <Clapperboard className="h-32 w-32 text-slate-700 mx-auto mb-6" />, title: "Kho nội dung trống", text: "Chưa có nội dung nào được đăng. Hãy quay lại sau." },
        video: { icon: <VideoIcon className="h-32 w-32 text-slate-700 mx-auto mb-6" />, title: "Chưa có video", text: "Chưa có video nào được đăng trong mục này." },
        image: { icon: <ImageIcon className="h-32 w-32 text-slate-700 mx-auto mb-6" />, title: "Chưa có ảnh", text: "Chưa có ảnh nào được đăng trong mục này." },
        link: { icon: <LinkIcon className="h-32 w-32 text-slate-700 mx-auto mb-6" />, title: "Chưa có link", text: "Chưa có link nào được đăng trong mục này." },
      };
      
      const message = emptyMessages[filterType];

      return (
        <div className="text-center py-20 bg-black/10 rounded-xl border border-white/5">
            {message.icon}
            <h2 className="text-3xl font-semibold text-slate-400 mb-4">{message.title}</h2>
            <p className="text-slate-500 text-lg">{message.text}</p>
        </div>
      )
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {siteAnnouncement && !isAiSearching && aiSearchResults === null && <AnnouncementBanner announcement={siteAnnouncement} />}
      <div className="max-w-screen-2xl mx-auto">
        
        {isAiSearching && <AiSearchLoader />}
        
        {!isAiSearching && (
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {aiSearchResults !== null && <Sparkles className="h-6 w-6 text-amber-400" />}
                    {getTitle()}
                </h2>
                <FilterChips currentFilter={filterType} onFilterChange={onFilterChange} />
             </div>
        )}

        {noContent ? <NoResultsMessage /> : (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10">
            {videos.map(video => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onPlay={onPlayVideo} 
                onViewProfile={onViewProfile} 
                isUserView={true} 
                currentUser={currentUser} 
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default UserView;