import React, { useState, useEffect } from 'react';
import { Search, X, Camera, Bell, Sparkles, Upload } from 'lucide-react';
import { getPharmacyLogo } from '../services/api';
import { DEFAULT_PHARMACY_LOGO } from '../constants/logo';
import { VoiceSearchButton } from './VoiceSearchButton';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onOpenPrescription?: () => void;
  onOpenRequestMissing?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onOpenPrescription,
  onOpenRequestMissing
}) => {
  const [logoUrl, setLogoUrl] = useState<string>(() => getPharmacyLogo() || DEFAULT_PHARMACY_LOGO);

  useEffect(() => {
    const handleLogoUpdate = (e: any) => {
      setLogoUrl(e.detail || getPharmacyLogo() || DEFAULT_PHARMACY_LOGO);
    };
    window.addEventListener('pharmacy_logo_updated', handleLogoUpdate);
    return () => window.removeEventListener('pharmacy_logo_updated', handleLogoUpdate);
  }, []);

  return (
    <div className="relative mt-4 mb-6 p-6 sm:p-10 rounded-3xl min-h-[220px] sm:min-h-[245px] flex flex-col justify-center items-start bg-gradient-to-br from-[#f0f6ff] via-[#ffffff] to-[#e8f2ff] border border-[#d6e6f9] overflow-hidden shadow-sm">
      {/* Decorative subtle ambient soft glow */}
      <div className="absolute -left-12 -top-12 w-80 h-80 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-pink-100/30 blur-3xl pointer-events-none" />

      {/* Official Pharmacy Logo Badge on the left */}
      <div className="hidden lg:flex absolute left-8 xl:left-12 top-1/2 -translate-y-1/2 flex-col items-center select-none z-10 pointer-events-none">
        <div className="relative w-40 h-40 xl:w-48 xl:h-48 rounded-full bg-white/95 backdrop-blur-sm p-2.5 shadow-[0_12px_36px_rgba(7,85,184,0.12)] border-4 border-[#eaf2ff] ring-1 ring-[#0755b8]/10 flex items-center justify-center transition-all">
          <img
            src={logoUrl || DEFAULT_PHARMACY_LOGO}
            alt="شعار صيدلية د. هبه الشواربي"
            className="w-full h-full object-contain"
          />
          <div
            className="absolute -bottom-3 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-md whitespace-nowrap border border-white/40"
            style={{
              backgroundColor: '#0755b8',
              backgroundImage: 'linear-gradient(135deg, #0755b8 0%, #f20c69 100%)',
              color: '#ffffff'
            }}
          >
            ✦ صيدلية معتمدة ورسمية
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl lg:max-w-xl xl:max-w-2xl">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0755b8] mb-2 sm:mb-3 tracking-tight">
          اطلب دواءك بسهولة وأمان
        </h2>
        <p className="text-sm sm:text-base text-[#47658a] mb-5">
          ابحث عن الدواء بالاسم أو المادة الفعالة أو بصوتك عبر الميكروفون 🎙️
        </p>

        {/* Search Bar with Integrated Voice Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="flex items-center gap-2 bg-[#f1f6fd] border border-[#dce9f8] p-1.5 sm:p-2 rounded-2xl w-full max-w-xl shadow-sm focus-within:border-[#0755b8]/60 focus-within:bg-blue-50/50 transition-all"
        >
          <div className="flex-1 flex items-center gap-2 bg-white border border-[#e1ebf8] rounded-xl px-3 py-2 shadow-2xs">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث باسم الدواء أو اضغط المايك وتحدث..."
              className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-[#15345b] placeholder:text-gray-400 font-medium"
            />

            {/* Clear Query Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Direct Camera Button inside Search Bar */}
            {onOpenPrescription && (
              <button
                type="button"
                onClick={onOpenPrescription}
                className="p-1 sm:p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1"
                title="ارفع أو صوّر روشتة الطبيب"
              >
                <Camera className="w-5 h-5 text-emerald-600" />
              </button>
            )}

            {/* Arabic Voice Search Microphone Button */}
            <VoiceSearchButton
              onTranscript={(transcript) => onSearchChange(transcript)}
              onSearchSubmit={onSearchSubmit}
              size="md"
            />
          </div>

          <button
            type="submit"
            className="bg-[#f20c69] hover:bg-[#d8085b] active:scale-95 text-white font-bold text-sm sm:text-base px-5 py-2.5 rounded-xl shadow-[0_5px_12px_rgba(242,12,105,0.22)] transition-all flex-shrink-0 cursor-pointer"
          >
            بحث
          </button>
        </form>

        {/* Eye-Catching Main Prescription Upload Banner */}
        {onOpenPrescription && (
          <div
            onClick={onOpenPrescription}
            className="mt-4 w-full max-w-xl text-white p-4 sm:p-5 rounded-3xl shadow-lg flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-98 border-2 border-emerald-400 group"
            style={{
              backgroundColor: '#047857',
              backgroundImage: 'linear-gradient(135deg, #065f46 0%, #059669 45%, #0284c7 100%)',
              color: '#ffffff'
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-sm sm:text-base text-white drop-shadow-xs">
                    معاك روشتة دكتور؟ صوّرها أو ارفعها هنا
                  </h3>
                  <span
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1"
                    style={{
                      backgroundColor: '#fef08a',
                      color: '#0f172a'
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-amber-700" />
                    <span>ذكاء اصطناعي</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed font-medium">
                  هنقرأ خط الطبيب ونطلعلك كل الأدوية المتوفرة بالصيدلية لإضافتها للسلة فوراً!
                </p>
              </div>
            </div>

            {/* Guaranteed High-Contrast Visible Button */}
            <button
              type="button"
              className="px-4 py-2.5 rounded-2xl shadow-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-transform group-hover:scale-105 cursor-pointer border-2"
              style={{
                backgroundColor: '#ffffff',
                color: '#047857',
                borderColor: '#a7f3d0'
              }}
            >
              <Camera className="w-4 h-4 flex-shrink-0" style={{ color: '#047857' }} />
              <span
                style={{
                  color: '#047857',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'inline-block'
                }}
              >
                ارفع الروشتة
              </span>
            </button>
          </div>
        )}

        {/* Missing medicine request button */}
        {onOpenRequestMissing && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={onOpenRequestMissing}
              className="bg-white/90 hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-rose-500" />
              <span>دواؤك غير متوفر؟ اضغط هنا لطلب توفيره وسنتواصل معك</span>
            </button>
          </div>
        )}

        {/* Quick Symptom Search Shortcuts */}
        <div className="flex items-center gap-1.5 flex-wrap mt-3 text-xs">
          <span className="text-gray-500 font-bold flex items-center gap-1">
            <span>💡</span>
            <span>أعراض شائعة:</span>
          </span>
          {[
            { label: '🌡️ خافض حرارة', query: 'خافض حراره' },
            { label: '🤕 مسكن للصداع', query: 'دوا للصداع' },
            { label: '👶 خافض حرارة للأطفال', query: 'خافض حراره للاطفال' },
            { label: '🤧 علاج البرد والإنفلونزا', query: 'دوا للبرد' },
            { label: '🔥 علاج الحموضة', query: 'علاج للحموضة' },
            { label: '🦠 مطهر معوي', query: 'مطهر معوي' }
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                onSearchChange(item.query);
                onSearchSubmit();
              }}
              className="bg-white/90 hover:bg-[#eaf3ff] text-[#0755b8] border border-[#d2e4f8] px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] shadow-2xs hover:border-[#0755b8] cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Feature Badges */}
        <div className="flex gap-2.5 flex-wrap mt-4 text-[#0755b8] text-xs font-bold">
          <span className="bg-white border border-[#dbeaff] rounded-full px-3 py-1.5 shadow-2xs">
            ✓ منتجات موثوقة ومفحوصة
          </span>
          <span className="bg-white border border-[#dbeaff] rounded-full px-3 py-1.5 shadow-2xs">
            ♡ رعاية صيدلانية واهتمام
          </span>
          <span className="bg-white border border-[#dbeaff] rounded-full px-3 py-1.5 shadow-2xs">
            ➜ طلب سهل وتوصيل سريع
          </span>
        </div>
      </div>
    </div>
  );
};
