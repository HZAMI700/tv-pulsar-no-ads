import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const PulsarFeatures: React.FC = () => {
  const { language } = useAppStore();
  const isRTL = language === 'ar';

  const features = [
    {
      title: isRTL ? 'استمتع بالمشاهدة على تلفزيونك' : 'Enjoy on your TV',
      body: isRTL
        ? 'شاهد على التلفزيونات الذكية، منصات الألعاب، أجهزة البث مثل Chromecast و Apple TV بضغطة زر واحدة وبدون إعلانات.'
        : 'Watch on smart TVs, game consoles, streaming sticks and Blu-ray players, with your whole library one remote press away.',
      image: '/art/feature-1.jpg',
      alt: 'Smart TV showing streaming library',
    },
    {
      title: isRTL ? 'تنزيل للمشاهدة بدون إنترنت' : 'Download to watch offline',
      body: isRTL
        ? 'احفظ أفلامك ومسلسلاتك المفضلة لتشاهدها في أي وقت على متن الطائرة أو في السفر عند انقطاع الإنترنت.'
        : 'Save your favourites and always have something to watch, on a plane, a train or anywhere the signal drops.',
      image: '/art/feature-2.jpg',
      alt: 'Watching offline on phone',
    },
    {
      title: isRTL ? 'شاهد في كل مكان' : 'Watch everywhere',
      body: isRTL
        ? 'بث مباشر عالي الدقة على هاتفك أو جهازك اللوحي أو الكمبيوتر، مع مزامنة تقدم المشاهدة أينما توقفت.'
        : 'Stream unlimited films and series on your phone, tablet, laptop and TV, and pick up exactly where you left off.',
      image: '/art/feature-3.jpg',
      alt: 'Multiple devices streaming Pulsar',
    },
  ];

  return (
    <div className="select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      {features.map((f, i) => (
        <section
          key={f.title}
          className="border-t-8 border-[#232323] bg-[#000000]"
        >
          <div
            className={`mx-auto grid max-w-[1200px] items-center gap-8 px-6 py-16 md:py-20 md:grid-cols-2 md:px-9 ${
              i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
            }`}
          >
            <div className="text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                {f.title}
              </h2>
              <p className="mt-4 text-sm sm:text-base md:text-xl text-white/70 leading-relaxed max-w-xl mx-auto md:mx-0">
                {f.body}
              </p>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#232323] border border-white/10 shadow-2xl">
              <img
                src={f.image}
                alt={f.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};