import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PulsarFooter } from '../layout/PulsarFooter';

export const DownloadPage: React.FC = () => {
  const { language } = useAppStore();
  const isRTL = language === 'ar';

  const platforms = [
    {
      name: isRTL ? 'أندرويد' : 'Android',
      detail: isRTL ? 'الهواتف والأجهزة اللوحية · أندرويد 8.0 أو أحدث' : 'Phones and tablets · Android 8.0 or later',
      version: 'v2.0.0 · 23 MB',
      cta: isRTL ? 'تحميل APK' : 'Download APK',
      href: '/TVPulsar_v2.0.0.apk',
    },
    {
      name: isRTL ? 'أندرويد TV' : 'Android TV',
      detail: isRTL ? 'التلفزيونات الذكية وأجهزة TV Box · أندرويد TV 9 أو أحدث' : 'Smart TVs, boxes and sticks · Android TV 9 or later',
      version: 'v2.0.0 · 25 MB',
      cta: isRTL ? 'تحميل للتلفزيون' : 'Download for TV',
      href: '/TVPulsar_v2.0.0.apk',
    },
    {
      name: isRTL ? 'ويندوز' : 'Windows',
      detail: isRTL ? 'ويندوز 10 و 11 · 64-bit' : 'Windows 10 and 11 · 64-bit',
      version: 'v1.0.4 · 88 MB',
      cta: isRTL ? 'تحميل للكمبيوتر' : 'Download for PC',
      href: '/TVPulsar_v2.0.0.apk',
    },
  ];

  const steps = [
    isRTL
      ? 'اضغط على زر تحميل APK على هاتفك ثم افتح الملف بعد اكتمال التنزيل.'
      : 'Tap Download APK on your Android phone and open the file when it finishes.',
    isRTL
      ? 'في حال طلب أندرويد الإذن، اسمح بالتثبيت من المتصفح في الإعدادات › التطبيقات › وصول خاص.'
      : 'If Android asks, allow installs from your browser in Settings › Apps › Special access.',
    isRTL
      ? 'اضغط تثبيت، ثم افتح تطبيق Pulsar TV وسجل دخولك بحسابك.'
      : 'Tap Install, then open Pulsar TV and sign in with your account.',
  ];

  const perks = [
    {
      title: isRTL ? 'تنزيل ومشاهدة بدون إنترنت' : 'Download & go',
      body: isRTL
        ? 'احفظ المسلسلات والأفلام لمشاهدتها بدون إنترنت، ثم تُحذف تلقائياً فور انتهائك من المشاهدة.'
        : 'Save series and films to watch offline, then they delete themselves once you have finished.',
    },
    {
      title: isRTL ? 'تنبيهات المباريات المباشرة' : 'Live match alerts',
      body: isRTL
        ? 'إشعارات لحظية لصافرة البداية، الأهداف، ونهاية المباريات لجميع الفرق التي تتابعها.'
        : 'Kickoff, goal and full-time notifications for the teams you follow.',
    },
    {
      title: isRTL ? 'المتابعة من حيث توقفت' : 'Picks up where you left off',
      body: isRTL
        ? 'ابدأ على التلفزيون وأكمل على هاتفك. تتم مزامنة التقدم عبر جميع أجهزتك.'
        : 'Start on your TV, finish on your phone. Progress syncs across every device.',
    },
  ];

  return (
    <main className="min-h-screen bg-[#000000] text-white select-none pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Header Banner (Screenshot 5) */}
      <section className="relative overflow-hidden border-b-8 border-[#232323] bg-[#000000]">
        <div className="relative mx-auto max-w-[1200px] px-6 pb-9 pt-10 md:pt-14 md:px-9">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            {isRTL ? 'Pulsar TV على جميع الشاشات' : 'Pulsar TV on every screen'}
          </h1>
          <p className="mt-2 max-w-[640px] text-sm sm:text-base md:text-lg text-white/80">
            {isRTL
              ? 'احصل على التطبيق لهاتفك وتلفزيونك والكمبيوتر. قم بتنزيل الأعمال للمشاهدة بدون إنترنت في أي مكان.'
              : 'Get the app for your phone, TV and computer. Download titles to watch offline, anywhere.'}
          </p>
        </div>
      </section>

      {/* 2. Choose Your Device (Screenshot 5) */}
      <section className="mx-auto max-w-[1200px] px-6 py-9 md:px-9">
        <h2 className="text-xl md:text-3xl font-bold text-white mb-6">
          {isRTL ? 'اختر جهازك' : 'Choose your device'}
        </h2>
        <div className="flex flex-col gap-4 max-w-xl md:max-w-none md:grid md:grid-cols-3">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex flex-col justify-between rounded-md bg-[#232323] p-5 sm:p-6 transition duration-300 hover:scale-[1.01] hover:shadow-[0_16px_36px_#000000]"
            >
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{p.name}</h3>
                <p className="mt-2 text-sm text-white/70">{p.detail}</p>
                <p className="mt-4 text-xs text-white/50">{p.version}</p>
              </div>

              <a
                href={p.href}
                download="TVPulsar_v2.0.0.apk"
                className="mt-6 block rounded-sm bg-[#e50914] px-4 py-3 text-center text-sm sm:text-base font-bold text-white transition-[filter] hover:brightness-110 active:scale-98 shadow-md"
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Install on Android in a minute (Screenshot 2) */}
      <section className="border-t-8 border-[#232323] bg-[#000000] py-12 md:py-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-9">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8">
            {isRTL ? 'التثبيت على أندرويد في دقيقة واحدة' : 'Install on Android in a minute'}
          </h2>
          <ol className="flex flex-col gap-5 max-w-2xl mb-8">
            {steps.map((text, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full bg-[#e50914] text-sm sm:text-base font-bold text-white shadow-md">
                  {i + 1}
                </span>
                <p className="text-sm sm:text-base text-white/90 pt-0.5 leading-relaxed">
                  {text}
                </p>
              </li>
            ))}
          </ol>

          {/* Airplane window screenshot image (Screenshot 2) */}
          <div className="relative aspect-video max-w-3xl overflow-hidden rounded-xl bg-[#232323] shadow-2xl">
            <img
              src="/art/feature-2.jpg"
              alt="Person using phone on plane"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* 4. More with the app (Screenshot 1) */}
      <section className="border-t-8 border-[#232323] bg-[#000000] py-12 md:py-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-9">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8">
            {isRTL ? 'مزايا إضافية مع التطبيق' : 'More with the app'}
          </h2>
          <div className="flex flex-col gap-4 max-w-2xl mx-auto md:max-w-none md:grid md:grid-cols-3">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-md bg-[#232323] p-6 transition duration-300 hover:scale-[1.01] hover:shadow-[0_16px_36px_#000000]"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{perk.title}</h3>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">{perk.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pulsar Footer */}
      <PulsarFooter />
    </main>
  );
};
