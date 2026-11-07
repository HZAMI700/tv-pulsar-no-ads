import React from 'react';
import { Settings, X, Shield, Send, RefreshCw, Smartphone, Zap, Globe } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SpoilerToggle } from '../../design-system/components/SpoilerToggle';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    noSpoilerMode,
    toggleNoSpoiler,
    setIsTelegramModalOpen,
    language,
    setLanguage,
  } = useAppStore();

  if (!isSettingsOpen) return null;

  const handleClearCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {}
  };

  return (
    <div
      onClick={() => setIsSettingsOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-[#0E1018] border border-white/15 p-6 space-y-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 text-[#FF1838]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">إعدادات التطبيق</h2>
              <p className="text-[11px] text-white/50">تخصيص المشغل وتجربة المشاهدة</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-4">
          {/* App Language Switcher */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/8">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00F2FE]" />
                <span className="text-xs font-bold text-white">
                  {language === 'ar' ? 'لغة التطبيق' : 'App Language'}
                </span>
              </div>
              <span className="text-[10px] text-white/50 block">
                {language === 'ar' ? 'تغيير اتجاه ولغة الواجهة' : 'Change interface language & layout'}
              </span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'ar'
                    ? 'bg-[#FF1838] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#FF1838] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* No Spoiler Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/8">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">حجب نتائج المباريات (No-Spoiler)</span>
              <span className="text-[10px] text-white/50 block">إخفاء الأهداف والنتائج المباشرة حتى لا تحرق عليك الإثارة</span>
            </div>
            <SpoilerToggle active={noSpoilerMode} onChange={toggleNoSpoiler} />
          </div>

          {/* Low Latency Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/8">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#00E676]" />
                <span className="text-xs font-bold text-white">تسريع البث (LL-HLS)</span>
              </div>
              <span className="text-[10px] text-white/50 block">مفعل افتراضياً للحد الأدنى من تأخير البث المباشر</span>
            </div>
            <span className="text-[10px] font-bold text-[#00E676] px-2 py-0.5 rounded bg-[#00E676]/10 border border-[#00E676]/30">
              نشط
            </span>
          </div>

          {/* Telegram Channel Button */}
          <button
            onClick={() => {
              setIsSettingsOpen(false);
              setIsTelegramModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-white hover:bg-[#00F2FE]/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-[#00F2FE]" />
              <div className="text-right">
                <span className="text-xs font-bold block">قناة تيليجرام الرسمية</span>
                <span className="text-[10px] text-white/60 block">@blackroner</span>
              </div>
            </div>
            <span className="text-xs text-[#00F2FE] font-bold">انضمام &larr;</span>
          </button>

          {/* Clear Cache */}
          <button
            onClick={handleClearCache}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/8 text-white/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-white/50" />
              <span className="text-xs font-semibold">إعادة تعيين ومسح الذاكرة المؤقتة</span>
            </div>
          </button>
        </div>

        {/* Footer / Version */}
        <div className="text-center pt-2 border-t border-white/8">
          <span className="text-[11px] font-mono text-white/40">
            TVPulsar v1.0.4 • TOD 2.0 Edition
          </span>
        </div>
      </div>
    </div>
  );
};
