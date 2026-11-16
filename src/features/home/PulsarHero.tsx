import React, { useState } from 'react';
import { Play, Sparkles, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface PulsarHeroProps {
  onGetStarted?: () => void;
}

export const PulsarHero: React.FC<PulsarHeroProps> = ({ onGetStarted }) => {
  const { language, setCurrentTab, setIsSettingsOpen } = useAppStore();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isRTL = language === 'ar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().includes('@')) {
      setSubmitted(true);
      setTimeout(() => {
        setIsSettingsOpen(true);
      }, 800);
    } else {
      // Navigate to discover movies or open settings
      setCurrentTab('movies');
    }
  };

  return (
    <section className="relative flex min-h-[580px] sm:min-h-[640px] items-center justify-center overflow-hidden select-none">
      {/* Background Artwork Image from /art/hero.jpg */}
      <img
        src="/art/hero.jpg"
        alt="Hero Background"
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-75 scale-105 transition-transform duration-700"
      />

      {/* Dim artwork and fade into true black */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.3) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 30%, transparent 20%, rgba(0,0,0,0.8) 90%)',
        }}
      />

      {/* Center Hero Content (Screenshot 7 & 8) */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <h1 className="max-w-3xl text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-xl">
          {isRTL ? 'أفلام ومسلسلات غير محدودة وأكثر' : 'Unlimited films, series and more'}
        </h1>

        <p className="mt-4 text-base sm:text-xl md:text-2xl text-white/90 font-medium drop-shadow">
          {isRTL ? 'شاهد في أي مكان. ألغِ في أي وقت.' : 'Stream anywhere. Cancel anytime.'}
        </p>

        <p className="mt-4 text-xs sm:text-sm md:text-base text-white/80 max-w-lg">
          {isRTL
            ? 'جاهز للمشاهدة؟ أدخل بريدك الإلكتروني لإنشاء عضويتك أو ابدأ المشاهدة فوراً.'
            : 'Ready to watch? Enter your email to create or restart your membership.'}
        </p>

        {submitted ? (
          <div className="mt-6 p-4 rounded-xl bg-[#232323] border border-[#e50914] text-white text-sm animate-in fade-in zoom-in-95">
            {isRTL ? 'شكراً لك! جارٍ توجيهك إلى شاشة المشاهدة...' : 'Thanks — redirecting you to your library...'}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 w-full max-w-xl flex flex-col sm:flex-row items-stretch justify-center gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRTL ? 'عنوان البريد الإلكتروني' : 'Email address'}
              className="min-h-13 sm:min-h-14 flex-1 rounded-md border border-white/30 bg-black/70 px-4 text-sm sm:text-base text-white placeholder:text-white/60 focus:outline-none focus:border-[#e50914] transition-colors"
            />
            <button
              type="submit"
              className="min-h-13 sm:min-h-14 rounded-md bg-[#e50914] hover:bg-[#f40612] px-6 text-base sm:text-lg font-bold text-white transition-all active:scale-98 shadow-xl flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{isRTL ? 'ابدأ الآن' : 'Get Started'}</span>
              <span className="text-xl leading-none">›</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
};