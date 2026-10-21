import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share2, MoreVertical, PlusSquare, ArrowUpRight } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed or dismissed by user for this session, hide banner
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const result = await install();
      if (result === 'manual') {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Top Banner on Mobile */}
      <div className="bg-gradient-to-r from-[#0755b8] to-[#043370] text-white py-2.5 px-3 sm:px-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
              <Smartphone className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold truncate">
                📲 نزّل تطبيق الصيدلية على شاشة هاتفك
              </p>
              <p className="text-[10px] sm:text-xs text-blue-100/90 truncate">
                تصفح أسرع واطلب بضغطة واحدة من الأيقونة مباشرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm py-1.5 px-3 sm:px-4 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت الأيقونة</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              title="إغلاق التنبيه"
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Visual Installation Guide Modal */}
      {showGuideModal && (
        <div
          onClick={() => setShowGuideModal(false)}
          className="fixed inset-0 z-50 bg-[#071b2a]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dce9f8] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0755b8] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0755b8]">
                    كيف تضع أيقونة التطبيق على شاشة هاتفك؟
                  </h3>
                  <p className="text-xs text-gray-500">
                    خطوات بسيطة وسريعة لتثبيت التطبيق على جهازك
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Android instructions */}
            {!isIOS ? (
              <div className="py-4 space-y-4">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
                  ⚠️ <strong>تنبيه هام:</strong> الضغط على زر "تنزيل" أو علامة السهم العادية في المتصفح يقوم بتحميل ملف صفحة عادية وليس تثبيت الأيقونة! لتثبيت أيقونة التطبيق اتبع الخطوات التالية:
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-[#0755b8] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs sm:text-sm text-gray-700">
                      اضغط على <strong>زر القائمة (الثلاث نقاط ⋮)</strong> في أعلى متصفح جوجل كروم بجانب شريط العنوان.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="w-6 h-6 rounded-full bg-[#0755b8] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs sm:text-sm text-gray-800">
                      اختر من القائمة: <strong>"تثبيت التطبيق" (Install App)</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية" (Add to Home screen)</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-[#0755b8] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="text-xs sm:text-sm text-gray-700">
                      اضغط على كلمة <strong>"تثبيت" (Install)</strong>، وسيتم وضع أيقونة صيدلية الشواربي على شاشة هاتفك فوراً!
                    </div>
                  </div>
                </div>

                {isInstallable && (
                  <button
                    onClick={async () => {
                      const res = await install();
                      if (res === 'accepted') setShowGuideModal(false);
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>جرّب التثبيت المباشر الآن</span>
                  </button>
                )}
              </div>
            ) : (
              /* iOS Safari instructions */
              <div className="py-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-[#0755b8] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs sm:text-sm text-gray-700 flex items-center gap-2 flex-wrap">
                      اضغط على زر <strong>المشاركة (Share)</strong>
                      <Share2 className="w-4 h-4 text-blue-600 inline" />
                      في شريط متصفح سفاري بالأسفل.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="w-6 h-6 rounded-full bg-[#0755b8] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs sm:text-sm text-gray-800 flex items-center gap-2 flex-wrap">
                      مرر الخيارات للأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية"</strong>
                      <PlusSquare className="w-4 h-4 text-[#0755b8] inline" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-[#0755b8] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="text-xs sm:text-sm text-gray-700">
                      اضغط على <strong>"إضافة" (Add)</strong> أعلى الشاشة، وستظهر أيقونة الصيدلية بجانب تطبيقاتك!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-xl text-xs sm:text-sm"
              >
                فهمت، حسناً
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
