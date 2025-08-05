import React from 'react';
import { X, Check, Star, Award, Gem, User, Video, Shield, MessageSquare, Cloud, Zap, BarChart2, Brush, Headphones, History, Download, FastForward, Film, Tv, Repeat, Bot, Eye, Gift, Palette, MonitorUp, ShieldAlert, Pin, EyeOff } from 'lucide-react';

const FeatureItem: React.FC<{ icon: React.ReactNode, text: string, vip?: boolean, svip?: boolean, normal?: boolean }> = ({ icon, text, vip, svip, normal }) => (
    <div className="flex items-center gap-4 py-2 border-b border-white/5">
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-400">{icon}</div>
        <span className="flex-1 text-slate-200">{text}</span>
        <div className="flex w-60 text-center">
            <div className={`flex-1 text-2xl font-thin ${normal ? 'text-green-400' : 'text-slate-600'}`}>{normal ? '✓' : '—'}</div>
            <div className={`flex-1 text-2xl font-thin ${vip ? 'text-sky-400' : 'text-slate-600'}`}>{vip ? '✓' : '—'}</div>
            <div className={`flex-1 text-2xl font-thin ${svip ? 'text-pink-400' : 'text-slate-600'}`}>{svip ? '✓' : '—'}</div>
        </div>
    </div>
);

const TierBenefitsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
            <div 
                className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-down"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-6 flex justify-between items-center border-b border-white/10 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Gem className="text-amber-400"/> Quyền lợi các Hạng</h2>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <div className="overflow-y-auto p-6 space-y-8">
                    {/* Header Row */}
                    <div className="flex justify-between items-end text-center sticky top-0 bg-slate-900/90 py-4 z-10 -mx-6 px-6">
                        <div className="text-left font-bold text-lg self-end pb-2">Tính năng</div>
                        <div className="flex w-60">
                            <div className="flex-1 p-2">
                                <h3 className="text-lg font-bold text-slate-300">Normal</h3>
                            </div>
                            <div className="flex-1 p-2">
                                <h3 className="text-lg font-bold text-sky-400 flex items-center justify-center gap-1.5"><Award className="h-5 w-5"/> VIP</h3>
                            </div>
                            <div className="flex-1 p-2">
                                <h3 className="text-lg font-bold text-pink-400 flex items-center justify-center gap-1.5"><Star className="h-5 w-5"/> SVIP</h3>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6 -mt-8">
                        {/* Profile Features */}
                        <div>
                            <h4 className="font-bold text-lg text-amber-400 mb-2">Hồ sơ & Giao diện</h4>
                            <div className="flex flex-col">
                                <FeatureItem icon={<User />} text="Tài khoản cơ bản" normal vip svip />
                                <FeatureItem icon={<Award />} text="Huy hiệu VIP trên hồ sơ" vip svip />
                                <FeatureItem icon={<Star />} text="Huy hiệu SVIP hoạt họa" svip />
                                <FeatureItem icon={<Brush />} text="Ảnh bìa hồ sơ" vip svip />
                                <FeatureItem icon={<Pin />} text="Ghim video lên hồ sơ" vip svip />
                                <FeatureItem icon={<Palette />} text="Màu tên tùy chỉnh trong bình luận" vip svip />
                                <FeatureItem icon={<Palette />} text="Gradient màu tên trong bình luận" svip />
                            </div>
                        </div>

                        {/* Content & Playback Features */}
                        <div>
                             <h4 className="font-bold text-lg text-amber-400 mb-2">Nội dung & Trải nghiệm xem</h4>
                             <div className="flex flex-col">
                                <FeatureItem icon={<ShieldAlert />} text="Trải nghiệm không quảng cáo" vip svip />
                                <FeatureItem icon={<Shield />} text="Xem nội dung độc quyền VIP" vip svip />
                                <FeatureItem icon={<Shield className="text-pink-400"/>} text="Xem nội dung độc quyền SVIP" svip />
                                <FeatureItem icon={<Tv />} text="Chất lượng video 720p" normal vip svip />
                                <FeatureItem icon={<Film />} text="Chất lượng video 1080p" vip svip />
                                <FeatureItem icon={<MonitorUp />} text="Chất lượng video 4K" svip />
                                <FeatureItem icon={<FastForward />} text="Điều chỉnh tốc độ phát" vip svip />
                                <FeatureItem icon={<Repeat />} text="Lặp lại video" vip svip />
                                <FeatureItem icon={<Download />} text="Tải video" vip svip />
                                <FeatureItem icon={<Download className="text-pink-400" />} text="Tải video chất lượng gốc" svip />
                                <FeatureItem icon={<History />} text="Lưu lịch sử xem" vip svip />
                                <FeatureItem icon={<EyeOff />} text="Tắt theo dõi lịch sử xem" svip />
                            </div>
                        </div>

                        {/* AI Features */}
                        <div>
                            <h4 className="font-bold text-lg text-amber-400 mb-2">Tính năng AI</h4>
                             <div className="flex flex-col">
                                <FeatureItem icon={<Bot />} text="Tóm tắt video bằng AI (Ngắn)" vip svip />
                                <FeatureItem icon={<Bot className="text-pink-400"/>} text="Tóm tắt video bằng AI (Chi tiết)" svip />
                                <FeatureItem icon={<Zap />} text="Phân tích & tạo thẻ cảnh bằng AI" svip />
                                <FeatureItem icon={<BarChart2 />} text="Xem phân tích video đã đăng" svip />
                            </div>
                        </div>

                         {/* Community & Upload Features */}
                        <div>
                            <h4 className="font-bold text-lg text-amber-400 mb-2">Cộng đồng & Upload</h4>
                             <div className="flex flex-col">
                                <FeatureItem icon={<Cloud />} text="Giới hạn upload (5/ngày)" normal vip />
                                <FeatureItem icon={<Cloud className="text-pink-400"/>} text="Upload không giới hạn" svip />
                                <FeatureItem icon={<MessageSquare />} text="Bình luận được làm nổi bật" vip svip />
                                <FeatureItem icon={<Pin />} text="Ghim bình luận trên video của mình" svip />
                                <FeatureItem icon={<Gift />} text="Tặng VIP cho người dùng khác" svip />
                                <FeatureItem icon={<Headphones />} text="Hỗ trợ ưu tiên" vip svip />
                            </div>
                        </div>
                    </div>

                </div>

                <footer className="p-6 border-t border-white/10 flex-shrink-0 text-center bg-slate-900/50">
                    <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all duration-300 transform hover:scale-105">
                        Nâng cấp ngay
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TierBenefitsModal;