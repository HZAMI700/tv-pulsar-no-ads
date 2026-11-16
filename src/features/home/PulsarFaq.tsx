import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export const PulsarFaq: React.FC = () => {
  const { language, setCurrentTab, setIsSettingsOpen } = useAppStore();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isRTL = language === 'ar';

  const faqs = [
    {
      q: isRTL ? 'ما هو تطبيق Pulsar TV؟' : 'What is Pulsar TV?',
      a: isRTL
        ? 'تطبيق Pulsar TV هو منصة بث ترفيهية تقدم أقوى الأفلام والمسلسلات والبرامج الوثائقية والقنوات الرياضية المباشرة بجودة عالية Full HD و 4K بدون إعلانات منبثقة، مع ميزة التنزيل للمشاهدة بدون إنترنت.'
        : 'Pulsar TV is a streaming service with award-winning series, films, documentaries and live sports channels on thousands of internet-connected devices. Watch as much as you want, whenever you want, with no adverts.',
    },
    {
      q: isRTL ? 'كم تبلغ تكلفة Pulsar TV؟' : 'How much does Pulsar TV cost?',
      a: isRTL
        ? 'التطبيق مجاني بالكامل للمستخدمين مع سيرفرات بث سريعة وتحديثات يومية لأحدث الإصدارات.'
        : 'Pulsar TV is completely free to stream and download, with high-speed dedicated servers and daily updates for new cinema releases.',
    },
    {
      q: isRTL ? 'أين يمكنني المشاهدة؟' : 'Where can I watch?',
      a: isRTL
        ? 'يمكنك المشاهدة في أي مكان: عبر متصفح الويب على جهاز الكمبيوتر والهاتف، أو عبر تطبيق الأندرويد المخصص للهواتف والأجهزة اللوحية وشاشات التلفزيون الذكية Android TV.'
        : 'Anywhere you are signed in: on the web, or with the Pulsar TV app on Android phones, tablets, Android TV, and smart streaming boxes.',
    },
    {
      q: isRTL ? 'كيف يمكنني التنزيل للمشاهدة بدون إنترنت؟' : 'How do I download to watch offline?',
      a: isRTL
        ? 'من خلال تطبيق الأندرويد، اضغط على زر التحميل في صفحة أي فيلم أو حلقة مسلسل، وسيتم حفظها مباشرة داخل مجلدات التطبيق لتشغيلها أينما كنت بدون نت.'
        : 'Inside the app, tap the Download button on any movie or series episode. It saves securely to your device for smooth offline playback without internet.',
    },
    {
      q: isRTL ? 'هل تتوفر الترجمة العربية؟' : 'Are Arabic subtitles available?',
      a: isRTL
        ? 'نعم، جميع الأفلام والمسلسلات تأتي بترجمة عربية احترافية تلقائية مدمجة وواضحة في أسفل الشاشة.'
        : 'Yes, full Arabic subtitles and multiple audio tracks are integrated directly into our offline and streaming players.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().includes('@')) {
      setSubmitted(true);
      setTimeout(() => {
        setIsSettingsOpen(true);
      }, 800);
    } else {
      setCurrentTab('movies');
    }
  };

  return (
    <section className="border-t-8 border-[#232323] bg-[#000000] py-16 md:py-24 select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-[1200px] px-6 md:px-9">
        <h2 className="text-center text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight">
          {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h2>

        {/* Accordion List (Screenshot 4) */}
        <div className="mt-10 flex flex-col gap-2 max-w-4xl mx-auto">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q} className="overflow-hidden rounded-xl">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 bg-[#232323] hover:bg-[#2a2a2a] px-6 py-5 text-left transition-colors cursor-pointer"
                >
                  <span className="text-base sm:text-xl font-semibold text-white">{item.q}</span>
                  <span className="text-2xl sm:text-3xl font-light text-[#e50914] leading-none shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-0.5 bg-[#2d2d2d] px-6 py-5 text-sm sm:text-base text-white/80 leading-relaxed animate-in fade-in duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Email Capture */}
        <div className="mt-12 text-center max-w-xl mx-auto">
          <p className="text-xs sm:text-sm text-white/80 mb-4">
            {isRTL
              ? 'جاهز للمشاهدة؟ أدخل بريدك الإلكتروني لإنشاء عضويتك أو ابدأ المشاهدة فوراً.'
              : 'Ready to watch? Enter your email to create or restart your membership.'}
          </p>

          {submitted ? (
            <div className="p-4 rounded-xl bg-[#232323] border border-[#e50914] text-white text-sm">
              {isRTL ? 'شكراً لك! جارٍ فتح إعدادات الحساب...' : 'Thanks — opening account settings...'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch justify-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRTL ? 'عنوان البريد الإلكتروني' : 'Email address'}
                className="min-h-12 flex-1 rounded-md border border-white/30 bg-black/70 px-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-[#e50914]"
              />
              <button
                type="submit"
                className="min-h-12 rounded-md bg-[#e50914] hover:bg-[#f40612] px-6 text-sm sm:text-base font-bold text-white transition-all active:scale-98 shadow-lg shrink-0 cursor-pointer"
              >
                {isRTL ? 'ابدأ الآن ›' : 'Get Started ›'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};