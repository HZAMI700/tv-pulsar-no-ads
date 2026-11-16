import React from 'react';
import { Send } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const PulsarFooter: React.FC = () => {
  const { language } = useAppStore();
  const isRTL = language === 'ar';

  const links = [
    isRTL ? 'الأسئلة الشائعة' : 'FAQ',
    isRTL ? 'مركز المساعدة' : 'Help Centre',
    isRTL ? 'الحساب' : 'Account',
    isRTL ? 'طرق المشاهدة' : 'Ways to Watch',
    isRTL ? 'شروط الاستخدام' : 'Terms of Use',
    isRTL ? 'الخصوصية' : 'Privacy',
    isRTL ? 'اتصل بنا' : 'Contact Us',
    isRTL ? 'قناة تيليجرام' : 'Telegram Community',
  ];

  return (
    <footer className="border-t-8 border-[#232323] bg-[#000000] py-14 text-white/60 select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-[1200px] px-6 md:px-9 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm">
            {isRTL ? 'لديك استفسار؟ انضم لمجتمعنا على تيليجرام' : 'Questions? Join our community on Telegram'}
          </p>
          <a
            href="https://t.me/blackroner"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#232323] hover:bg-[#2e2e2e] text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-[#e50914]" />
            <span>@blackroner</span>
          </a>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {links.map((l) => (
            <li key={l}>
              <a href="#" className="hover:text-white hover:underline transition-colors">
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <span className="font-bold uppercase tracking-tight text-[#e50914]">Pulsar TV</span>
          <span>© 2026 Pulsar TV. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};