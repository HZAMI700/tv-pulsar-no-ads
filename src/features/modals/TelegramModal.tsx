import React from 'react';
import { Send, X, Bell, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GlowButton } from '../../design-system/components/GlowButton';

export const TelegramModal: React.FC = () => {
  const { isTelegramModalOpen, setIsTelegramModalOpen, markTelegramPrompted } = useAppStore();

  if (!isTelegramModalOpen) return null;

  const handleClose = () => {
    markTelegramPrompted();
    setIsTelegramModalOpen(false);
  };

  const handleJoin = () => {
    window.open('https://t.me/blackroner', '_blank');
    handleClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#101424] to-[#0A0C13] border border-[#00F2FE]/30 p-6 md:p-8 shadow-[0_0_50px_rgba(0,242,254,0.2)] text-center space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Telegram Radiant Glow Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#0088cc] to-[#00F2FE] flex items-center justify-center shadow-[0_0_35px_rgba(0,242,254,0.5)]">
          <Send className="w-10 h-10 text-white ml-0.5" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF1838] border-2 border-[#0A0C13] flex items-center justify-center">
            <Bell className="w-3 h-3 text-white" />
          </span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-black text-white">
            انضم إلى قناتنا على تيليجرام!
          </h2>
          <p className="text-xs md:text-sm text-white/70 leading-relaxed max-w-sm mx-auto">
            كن أول من يحصل على روابط البث المباشر لأهم المباريات، تحديثات السيرفرات اليومية وأحدث الأفلام والمسلسلات.
          </p>
        </div>

        {/* Channel Username Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-xs font-mono font-bold text-[#00F2FE]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
          <span>https://t.me/blackroner</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <GlowButton
            size="lg"
            variant="primary"
            className="w-full"
            icon={<Send className="w-4 h-4" />}
            onClick={handleJoin}
          >
            انضم الآن للقناة
          </GlowButton>

          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            تذكيري لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
};
