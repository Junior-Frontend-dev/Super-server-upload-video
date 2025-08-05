
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, ThumbsUp, ThumbsDown, Eye, Clock, Sparkles, MessageCircle, Send, BadgeCheck, Star, Award, Crown, Settings, ChevronDown, Check, FastForward, Repeat, Download, Pin, PinOff, Tv, Film, AlertTriangle, MonitorPlay, MonitorUp, BarChart2, Zap, ShieldAlert } from 'lucide-react';
import { Video, User, Comment } from '../types';
import { summarizeVideo } from '../services/geminiService';

const UpNextVideoCard: React.FC<{ video: Video, onPlay: (video: Video) => void }> = ({ video, onPlay }) => (
    <div className="flex gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors" onClick={() => onPlay(video)}>
        <div className="w-40 h-24 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 relative">
            <img src={video.thumbnailUrl || ''} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
        </div>
        <div className="flex-1">
            <h4 className="font-semibold text-white line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">{video.title}</h4>
            <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                <p>{video.uploaderName}</p>
                <p>{video.views.toLocaleString('vi-VN')} lượt xem</p>
            </div>
        </div>
    </div>
);

const PlayerSettings: React.FC<{
    currentUser: User | null,
    onClose: () => void,
    videoRef: React.RefObject<HTMLVideoElement>;
}> = ({ currentUser, onClose, videoRef }) => {
    // These would be implemented with a real player API
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const qualities = [
        { label: '480p', icon: <Tv className="h-4 w-4"/>, tier: 'Normal' },
        { label: '720p', icon: <MonitorPlay className="h-4 w-4"/>, tier: 'Normal' },
        { label: '1080p', icon: <Film className="h-4 w-4"/>, tier: 'Vip' },
        { label: '4K', icon: <MonitorUp className="h-4 w-4"/>, tier: 'SVip' },
    ] as const;
    const [currentSpeed, setCurrentSpeed] = useState(1);
    const [currentQuality, setCurrentQuality] = useState('720p');

    useEffect(() => {
        if (videoRef.current) {
            setCurrentSpeed(videoRef.current.playbackRate);
        }
    }, [videoRef]);

    const canAccess = (tier: 'Normal' | 'Vip' | 'SVip') => {
        if (!currentUser) return tier === 'Normal';
        if (currentUser.tier === 'SVip') return true;
        if (currentUser.tier === 'Vip') return tier !== 'SVip';
        return tier === 'Normal';
    }

    const handleSpeedChange = (speed: number) => {
        if (canAccess('Vip')) {
            setCurrentSpeed(speed);
            if (videoRef.current) {
                videoRef.current.playbackRate = speed;
            }
        }
    };

    return (
        <div className="absolute bottom-14 right-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg p-3 w-48 shadow-lg z-20 animate-fade-in-down text-sm">
           <h4 className="font-semibold mb-2 px-1 text-slate-300">Tốc độ</h4>
           <div className="grid grid-cols-3 gap-1 mb-3">
            {speeds.map(s => (
                <button key={s} onClick={() => handleSpeedChange(s)} className={`py-1 rounded font-medium transition-colors ${!canAccess('Vip') && s !== 1 ? 'opacity-50 cursor-not-allowed' : ''} ${currentSpeed === s ? 'bg-amber-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}>
                    {s}x
                </button>
            ))}
           </div>
            <h4 className="font-semibold mb-2 px-1 text-slate-300">Chất lượng</h4>
           <div className="space-y-1">
            {qualities.map(q => (
                <button key={q.label} onClick={() => canAccess(q.tier) && setCurrentQuality(q.label)} disabled={!canAccess(q.tier)} className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-colors text-left ${!canAccess(q.tier) ? 'opacity-50 cursor-not-allowed' : ''} ${currentQuality === q.label ? 'bg-amber-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>
                    <span className="flex items-center gap-2">{q.icon} {q.label}</span>
                    {q.tier !== 'Normal' && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${q.tier === 'Vip' ? 'bg-sky-500/80 text-white' : 'bg-pink-500/80 text-white'}`}>{q.tier}</span>}
                </button>
            ))}
           </div>
        </div>
    )
}

const AdPlaceholder: React.FC = () => (
    <div className="w-full bg-slate-800 my-4 p-4 rounded-lg text-center text-slate-400 border border-dashed border-slate-700">
        <p className="font-semibold text-lg text-slate-500">QUẢNG CÁO</p>
        <p className="text-sm">Nâng cấp VIP hoặc SVIP để có trải nghiệm không quảng cáo!</p>
    </div>
);

const VideoAnalytics: React.FC<{ video: Video }> = ({ video }) => {
    const data = useMemo(() => {
        const views = video.analytics?.viewsByDate || {};
        const last7Days = Array.from({length: 7}).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => ({
            date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit'}),
            views: views[date] || 0
        }));
    }, [video.analytics]);

    const maxViews = Math.max(...data.map(d => d.views), 1);

    return (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-xl p-4 mt-4">
             <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-amber-400" />
                Phân tích lượt xem (7 ngày qua)
            </h3>
            <div className="flex justify-around items-end h-40 gap-2">
                {data.map(item => (
                    <div key={item.date} className="flex flex-col items-center flex-1">
                        <div className="text-xs font-bold text-white">{item.views}</div>
                        <div 
                            className="w-full bg-gradient-to-t from-amber-500 to-orange-500 rounded-t-md transition-all duration-500"
                            style={{ height: `${(item.views / maxViews) * 100}%`}}
                            title={`${item.views} views on ${item.date}`}
                        ></div>
                        <div className="text-xs text-slate-400 mt-1">{item.date}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const WatchPage: React.FC<{
  video: Video;
  allVideos: Video[];
  onClose: () => void;
  onInteraction: (videoId: number, type: 'like' | 'dislike') => void;
  interactionStatus?: 'liked' | 'disliked';
  onCommentSubmit: (videoId: number, commentText: string) => void;
  onPinComment: (videoId: number, commentId: number) => void;
  currentUser: User | null;
  onViewProfile: (userId: number) => void;
  users: User[];
  onPlayNext: (video: Video) => void;
  onGenerateScenes: (videoId: number) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}> = ({ video, allVideos, onClose, onInteraction, interactionStatus, onCommentSubmit, onPinComment, currentUser, onViewProfile, users, onPlayNext, onGenerateScenes, showToast }) => {
  const [comment, setComment] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSceneTagging, setIsSceneTagging] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Reset state when video changes
    setSummary(null);
    setSummaryError(null);
    setIsSummarizing(false);
    setShowDescription(false);
    setShowPlayerSettings(false);
  }, [video.id]);


  const uploader = users.find(u => u.id === video.uploaderId);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && currentUser) {
      onCommentSubmit(video.id, comment.trim());
      setComment('');
    }
  };

  const handleSummarize = async (detailLevel: 'short' | 'detailed') => {
    if ((currentUser?.tier !== 'Vip' && currentUser?.tier !== 'SVip') || (detailLevel === 'detailed' && currentUser?.tier !== 'SVip')) {
        showToast("Tính năng này yêu cầu hạng thành viên cao hơn.", 'error');
        return;
    }
    setIsSummarizing(true);
    setSummary(null);
    setSummaryError(null);
    try {
        const result = await summarizeVideo(video.title, detailLevel);
        setSummary(result);
        if (!showDescription) setShowDescription(true);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
        setSummaryError(message);
    } finally {
        setIsSummarizing(false);
    }
  };
  
  const handleGenerateScenes = async () => {
    if (currentUser?.tier !== 'SVip') {
        showToast("Chỉ SVIP mới có thể dùng tính năng này.", "error");
        return;
    }
    setIsSceneTagging(true);
    await onGenerateScenes(video.id);
    setIsSceneTagging(false);
  }

  const handleTimestampClick = (time: number) => {
    if (videoRef.current) {
        videoRef.current.currentTime = time;
        videoRef.current.play();
    }
  }
  
  const upNextVideos = useMemo(() => {
      return allVideos.filter(v => v.id !== video.id).slice(0, 15);
  }, [allVideos, video.id]);

  const approvedComments = useMemo(() => {
    const comments = (video.comments || []).filter(c => c.status === 'approved');
    const pinnedComment = comments.find(c => c.isPinned);
    const otherComments = comments.filter(c => !c.isPinned);
    return pinnedComment ? [pinnedComment, ...otherComments] : otherComments;
  }, [video.comments]);
  
  const canDownload = currentUser?.tier === 'Vip' || currentUser?.tier === 'SVip';
  const downloadTooltip = currentUser?.tier === 'SVip' ? "Tải về chất lượng gốc" : "Tải về";
  const downloadFilename = video.filePath?.split('/').pop() || `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
  
  const isAdVisible = !currentUser || (currentUser.tier !== 'Vip' && currentUser.tier !== 'SVip');
  const isOwnerSVIP = currentUser?.tier === 'SVip' && currentUser.id === video.uploaderId;

  return (
    <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-screen-2xl mx-auto">
      <div className="lg:col-span-2 xl:col-span-3">
        <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-2xl shadow-black/50 relative group">
          {video.type === 'image' && video.imageUrl ? (
              <img src={video.imageUrl} alt={video.title} className="w-full h-full object-contain" />
          ) : (
              <video ref={videoRef} src={video.videoUrl} key={video.id} className="w-full h-full" controlsList="nodownload" controls autoPlay onError={(e) => console.error('Video playback error:', e.nativeEvent)} />
          )}
           <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors">
                <X className="h-6 w-6" />
            </button>
            <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                {currentUser && currentUser.tier !== 'Normal' && (
                    <button onClick={() => {}} title="Lặp lại video" className="p-2.5 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors">
                        <Repeat className="h-5 w-5"/>
                    </button>
                )}
                <button onClick={() => setShowPlayerSettings(s => !s)} title="Cài đặt" className="p-2.5 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors">
                    <Settings className="h-5 w-5"/>
                </button>
            </div>
            {showPlayerSettings && <PlayerSettings currentUser={currentUser} onClose={() => setShowPlayerSettings(false)} videoRef={videoRef} />}
        </div>
        
        {isAdVisible && <AdPlaceholder />}

        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4">{video.title}</h1>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <button onClick={() => onViewProfile(video.uploaderId)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="relative">
                    <img src={uploader?.avatarUrl} alt={video.uploaderName} className="w-12 h-12 rounded-full" />
                    {uploader?.username === 'admin' ? (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2" title="Admin">
                            <Crown className="h-5 w-5 text-yellow-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.7))' }} />
                        </div>
                    ) : uploader?.tier === 'SVip' ? (
                        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full text-[10px] font-bold text-white border-2 border-slate-900 svip-badge-glow" title="SVIP User">
                            SVIP
                        </div>
                    ) : uploader?.tier === 'Vip' ? (
                        <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full text-[10px] font-bold text-white border-2 border-slate-900 vip-badge-glow" title="VIP User">
                            VIP
                        </div>
                    ) : null}
                </div>
                <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                        {video.uploaderName}
                        {video.isUploaderVerified && <span title="Verified User"><BadgeCheck className="h-5 w-5 text-blue-400" /></span>}
                    </div>
                </div>
            </button>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full bg-white/5 border border-white/10 h-11 backdrop-blur-sm">
                <button onClick={() => onInteraction(video.id, 'like')} className={`flex items-center gap-2 pl-5 pr-4 py-2 rounded-l-full transition-colors font-semibold ${interactionStatus === 'liked' ? "text-amber-400 bg-white/10" : "text-slate-300 hover:bg-white/10"}`}>
                  <ThumbsUp className="h-5 w-5" /> <span>{video.likes}</span>
                </button>
                 <div className="w-px h-6 bg-white/10"></div>
                <button onClick={() => onInteraction(video.id, 'dislike')} className={`px-4 py-2 transition-colors ${interactionStatus === 'disliked' ? "text-slate-200 bg-white/10" : "text-slate-300 hover:bg-white/10"}`}>
                  <ThumbsDown className="h-5 w-5" />
                </button>
                {canDownload && (
                    <>
                    <div className="w-px h-6 bg-white/10"></div>
                     <a href={video.videoUrl} download={downloadFilename} title={downloadTooltip} className="px-4 py-2 rounded-r-full transition-colors text-slate-300 hover:bg-white/10 flex items-center">
                        <Download className="h-5 w-5" />
                     </a>
                    </>
                )}
              </div>
          </div>
        </div>
        
        {isOwnerSVIP && <VideoAnalytics video={video} />}

        <div className="bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-xl p-4 mt-6 text-sm text-slate-300 transition-all duration-300">
           <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-4 font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4"/> {video.views.toLocaleString('vi-VN')} lượt xem</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4"/> {video.uploadDate}</span>
              </div>
           </div>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showDescription ? 'max-h-[500px]' : 'max-h-20'}`}>
                <div className="space-y-2 pt-3 border-t border-white/10">
                    {isSummarizing ? (
                        <div className="space-y-3 py-1">
                            <div className="h-4 bg-slate-700/50 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-slate-700/50 rounded w-1/2 animate-pulse"></div>
                        </div>
                    ) : summaryError ? (
                        <p className="text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> {summaryError}</p>
                    ) : summary ? (
                        <>
                            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{summary}</p>
                            <p className="text-xs text-amber-400/80 italic pt-3 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              <span>Powered by Gemini</span>
                            </p>
                        </>
                    ) : (
                        <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">Nhấn nút bên dưới để xem tóm tắt nội dung video do AI tạo ra.</p>
                    )}
                </div>
            </div>
            <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between flex-wrap gap-2">
                <button onClick={() => setShowDescription(!showDescription)} className="font-semibold text-amber-400 hover:text-amber-300 text-xs">
                    {showDescription ? 'Ẩn bớt' : 'Hiển thị thêm'}
                </button>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSummarize('short')} disabled={isSummarizing || (currentUser?.tier !== 'Vip' && currentUser?.tier !== 'SVip')} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-300 rounded-full hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Yêu cầu VIP">
                    <Sparkles className={`h-4 w-4 ${isSummarizing ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-semibold">{isSummarizing ? 'Đang tóm tắt...' : 'Tóm tắt ngắn'}</span>
                </button>
                 <button onClick={() => handleSummarize('detailed')} disabled={isSummarizing || currentUser?.tier !== 'SVip'} className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 text-pink-300 rounded-full hover:bg-pink-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Yêu cầu SVIP">
                    <Sparkles className={`h-4 w-4 ${isSummarizing ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-semibold">{isSummarizing ? '...' : 'Tóm tắt chi tiết'}</span>
                </button>
              </div>
            </div>
        </div>
        
        {currentUser?.tier === 'SVip' && video.type === 'video' && (
            <div className="bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-xl p-4 mt-4">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-pink-400"/> Phân tích cảnh (SVIP)
                </h3>
                {video.aiSceneTags && video.aiSceneTags.length > 0 ? (
                    <div className="space-y-2">
                        {video.aiSceneTags.map(tag => (
                            <div key={tag.timestamp} onClick={() => handleTimestampClick(tag.timestamp)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
                                <button className="font-mono text-sm px-2 py-1 bg-amber-500 text-black rounded font-semibold">{new Date(tag.timestamp * 1000).toISOString().substr(14, 5)}</button>
                                <p className="text-slate-300">{tag.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                     <button onClick={handleGenerateScenes} disabled={isSceneTagging} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-pink-500/10 text-pink-300 rounded-lg hover:bg-pink-500/20 transition-colors disabled:opacity-50">
                        <Zap className={`h-4 w-4 ${isSceneTagging ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-semibold">{isSceneTagging ? 'Đang phân tích...' : 'Dùng AI để tạo thẻ cảnh'}</span>
                    </button>
                )}
            </div>
        )}

        {/* Comments Section */}
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6"><MessageCircle className="h-5 w-5"/> Bình luận ({approvedComments.length || 0})</h2>
            <div className="flex items-start gap-4 mb-6">
                <img src={currentUser?.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=guest`} alt="avatar" className="h-11 w-11 rounded-full flex-shrink-0" />
                <form onSubmit={handleCommentSubmit} className="flex-1">
                     <div className="relative">
                        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={currentUser ? "Viết bình luận công khai..." : "Bạn phải đăng nhập để bình luận."} className="w-full bg-transparent border-b-2 border-slate-700 focus:border-amber-500 outline-none transition pb-2 text-base" required disabled={!currentUser} />
                        <div className={`absolute right-0 top-full mt-3 flex justify-end gap-3 transition-all duration-300 ${comment ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <button type="button" onClick={() => setComment('')} className="px-5 py-2 rounded-full hover:bg-white/10 font-semibold transition-colors">Hủy</button>
                            <button type="submit" disabled={!comment.trim()} className="px-5 py-2 rounded-full bg-amber-500 text-black hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400 font-semibold transition-colors">Bình luận</button>
                        </div>
                     </div>
                </form>
            </div>
             <div className="space-y-4">
                  {approvedComments.length > 0 ? ([...approvedComments].map(c => {
                      const commenter = users.find(u => u.id === c.userId);
                      const isUploaderSVIP = uploader?.tier === 'SVip' && uploader.id === currentUser?.id;
                      const commentClasses = commenter?.tier === 'SVip' ? 'svip-comment' : commenter?.tier === 'Vip' ? 'vip-comment' : '';
                      
                      const nameStyle: React.CSSProperties = {};
                      if (commenter?.commentStyle?.gradient) {
                          nameStyle.background = `linear-gradient(to right, ${commenter.commentStyle.gradient.from}, ${commenter.commentStyle.gradient.to})`;
                          nameStyle.WebkitBackgroundClip = 'text';
                          nameStyle.WebkitTextFillColor = 'transparent';
                      } else if (commenter?.commentStyle?.color) {
                          nameStyle.color = commenter.commentStyle.color;
                      }

                      return (
                      <div key={c.id} className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${commentClasses}`}>
                        <button onClick={() => onViewProfile(c.userId)} className="flex-shrink-0 relative pt-1">
                          <img src={c.avatarUrl} alt="avatar" className="h-10 w-10 rounded-full" />
                            {commenter?.username === 'admin' ? (
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2" title="Admin">
                                    <Crown className="h-4 w-4 text-yellow-400" style={{ filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.7))' }} />
                                </div>
                            ) : commenter?.tier === 'SVip' ? (
                                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full text-[9px] font-bold text-white border border-slate-900 svip-badge-glow" title="SVIP User">
                                    SVIP
                                </div>
                            ) : commenter?.tier === 'Vip' ? (
                                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full text-[9px] font-bold text-white border border-slate-900 vip-badge-glow" title="VIP User">
                                    VIP
                                </div>
                            ) : null}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <button onClick={() => onViewProfile(c.userId)} className="font-semibold text-sm hover:underline flex items-center gap-1.5">
                              <span style={nameStyle}>{c.displayName}</span>
                              {c.isUserVerified && <BadgeCheck className="h-4 w-4 text-blue-400" />}
                            </button>
                            <p className="text-xs text-slate-500">{new Date(c.timestamp).toLocaleDateString('vi-VN')}</p>
                            {c.isPinned && <span className="flex items-center gap-1 text-xs text-amber-400"><Pin className="h-3 w-3" /> Đã ghim</span>}
                          </div>
                          <p className="text-slate-200 mt-1 text-sm leading-relaxed whitespace-pre-wrap">{c.text}</p>
                        </div>
                        {isUploaderSVIP && (
                            <button onClick={() => onPinComment(video.id, c.id)} className="p-2 text-slate-500 hover:text-amber-400 transition-colors" title={c.isPinned ? "Bỏ ghim" : "Ghim bình luận"}>
                                {c.isPinned ? <PinOff className="h-4 w-4"/> : <Pin className="h-4 w-4"/>}
                            </button>
                        )}
                      </div>
                  )})) : (<p className="text-slate-500 text-center py-6">Chưa có bình luận nào. Hãy là người đầu tiên!</p>)}
              </div>
        </div>
      </div>
      
      <div className="lg:col-span-1 xl:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Tiếp theo</h3>
          <div className="space-y-2">
              {upNextVideos.map(v => <UpNextVideoCard key={v.id} video={v} onPlay={onPlayNext} />)}
          </div>
      </div>
    </div>
  );
};

export default WatchPage;