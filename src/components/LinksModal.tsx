import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Info,
  Share2,
  QrCode,
  Smartphone,
  Download,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface LinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToAdmin: () => void;
  onGoToCustomer: () => void;
  initialTab?: 'links' | 'howToShare' | 'pwaInstall';
}

export const LinksModal: React.FC<LinksModalProps> = ({
  isOpen,
  onClose,
  onGoToAdmin,
  onGoToCustomer,
  initialTab = 'links'
}) => {
  const [copiedCustomer, setCopiedCustomer] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'links' | 'howToShare' | 'pwaInstall'>(initialTab);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const pathname = window.location.pathname.replace(/\/admin\/?$/, '').replace(/\/$/, '') || '';
  
  const customerUrl = `${origin}${pathname}/`;
  const adminUrl = `${origin}${pathname}/#admin`;

  const promoMessage = `🌸 *صيدلية د. هبه الشواربي* 💊\nصحتك تهمنا! يسعدنا خدمتكم الآن وطلب جميع أدويتكم ومستلزماتكم مباشرة عبر تطبيقنا على الإنترنت والتوصيل لباب بيتك:\n🔗 ${customerUrl}\n\n• ابحث عن الأدوية المتوفرة وبدائلها\n• اطلب بسهولة وبدون انتظار\n• التوصيل سريع حتى باب المنزل 🛵`;

  const copyToClipboard = (text: string, type: 'customer' | 'admin' | 'msg') => {
    navigator.clipboard.writeText(text);
    if (type === 'customer') {
      setCopiedCustomer(true);
      setTimeout(() => setCopiedCustomer(false), 2000);
    } else if (type === 'admin') {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    } else {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(promoMessage)}`;
    window.open(url, '_blank');
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(customerUrl)}&margin=10`;

  const handleDownloadShortcut = () => {
    try {
      const shortcutContent = `[InternetShortcut]\r\nURL=${adminUrl}\r\nIconIndex=0\r\nIconFile=${origin}/favicon.ico\r\n`;
      const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'صيدلية د. هبه الشواربي - لوحة الإدارة.url';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccessMsg('تم تنزيل ملف الاختصار بنجاح! اسحبه أو انقله إلى سطح المكتب لتفتحه بنقرة واحدة.');
      setTimeout(() => setDownloadSuccessMsg(''), 7000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadLauncher = () => {
    try {
      const batContent = `@echo off\r\nchcp 65001 > nul\r\ntitle صيدلية د. هبه الشواربي\r\necho ====================================================\r\necho   جاري تشغيل صيدلية د. هبه الشواربي كبرنامج كمبيوتر...\r\necho ====================================================\r\nstart "" chrome.exe --app="${adminUrl}" 2>nul || start "" msedge.exe --app="${adminUrl}" 2>nul || start "" "${adminUrl}"\r\nexit\r\n`;
      const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'تشغيل صيدلية الشواربي.bat';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccessMsg('تم تنزيل مشغل البرنامج المستقل (.bat)! ضعه على سطح المكتب وافتحه للدخول المباشر.');
      setTimeout(() => setDownloadSuccessMsg(''), 7000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#071b2a]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-7 shadow-2xl relative border border-[#dce9f8] my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 flex items-center justify-center cursor-pointer transition-colors border border-gray-200 shadow-2xs"
          title="إغلاق (X)"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0755b8] to-[#f20c69] text-white flex items-center justify-center font-bold shadow-sm">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#102a43]">
              دليل نشر واستخدام التطبيق مع العملاء
            </h3>
            <p className="text-xs text-gray-500">
              كيف يصل التطبيق للزبائن، روابط المتجر والإدارة، والتزامن الفوري
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'links'
                ? 'bg-white text-[#0755b8] shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔗 الروابط والمشاركة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('howToShare')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'howToShare'
                ? 'bg-white text-[#0755b8] shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📲 كيف يستخدمه الناس؟
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwaInstall')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pwaInstall'
                ? 'bg-white text-[#0755b8] shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📱 تثبيت كتطبيق هاتف
          </button>
        </div>

        {/* TAB 1: Links & Sharing */}
        {activeTab === 'links' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Realtime Sync Highlight Alert */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <b>تزامن فوري ومباشر:</b> أي دواء تضيفه أو تعدل سعره في لوحة الإدارة يظهر فوراً وتلقائياً للعملاء في واجهة المتجر بدون تأخير!
              </span>
            </div>

            {/* 1. Customer Store Link */}
            <div className="p-4 rounded-2xl border-2 border-blue-100 bg-[#f8fbff]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 font-bold text-sm text-[#0755b8]">
                  <ShoppingBag className="w-4 h-4 text-[#f20c69]" />
                  <span>1. رابط واجهة العميل (المتجر والطلب)</span>
                </span>
                <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  للزبائن والجمهور
                </span>
              </div>

              <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                هذا الرابط يرى فيه العميل <b>الأدوية المتوفرة فقط</b> وأسعارها، مع إمكانية إضافتها للسلة وتأكيد طلب التوصيل باسمه ورقم هاتفه وعنوانه.
              </p>

              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2 mb-2" dir="ltr">
                <input
                  type="text"
                  readOnly
                  value={customerUrl}
                  className="w-full text-xs font-mono text-gray-700 bg-transparent outline-none truncate"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(customerUrl, 'customer')}
                  className="flex items-center gap-1 bg-[#0755b8] hover:bg-[#06479b] text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer"
                >
                  {copiedCustomer ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCustomer ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-blue-100">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="text-xs bg-[#168c4a] hover:bg-[#12723c] text-white font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة بالواتساب مع رسالة ترويجية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onGoToCustomer();
                    onClose();
                  }}
                  className="text-xs text-[#0755b8] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>فتح واجهة العميل الآن</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 2. Admin Portal Link */}
            <div className="p-4 rounded-2xl border-2 border-pink-100 bg-[#fffbfc]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 font-bold text-sm text-[#f20c69]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. رابط لوحة تحكم الإدارة والصيدلي</span>
                </span>
                <span className="text-[11px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full font-bold">
                  خاص بالإدارة فقط
                </span>
              </div>

              <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                مخصص لك ولطاقم الصيدلية لمتابعة <b>طلبات العملاء الواردة</b> وتغيير حالتها، وتعديل <b>مخزون الأدوية والأسعار</b> وإضافة أصناف جديدة. (محمي برمز مرور: <b>1234</b>).
              </p>

              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2 mb-2" dir="ltr">
                <input
                  type="text"
                  readOnly
                  value={adminUrl}
                  className="w-full text-xs font-mono text-gray-700 bg-transparent outline-none truncate font-bold text-[#0755b8]"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(adminUrl, 'admin')}
                  className="flex items-center gap-1 bg-[#f20c69] hover:bg-[#d8085b] text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer"
                >
                  {copiedAdmin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAdmin ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    onGoToAdmin();
                    onClose();
                  }}
                  className="text-xs text-[#f20c69] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>فتح لوحة تحكم الإدارة الآن</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: How People Get & Use It */}
        {activeTab === 'howToShare' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#f8fbff] border border-[#dbeaff] p-4 rounded-2xl">
              <h4 className="font-bold text-sm text-[#0755b8] mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#f20c69]" />
                <span>كيف يصل التطبيق إلى هواتف الناس والعملاء؟</span>
              </h4>
              <ul className="text-xs text-gray-700 space-y-2 leading-relaxed list-disc list-inside">
                <li>
                  <b>الرابط المباشر عبر الويب:</b> التطبيق يعمل على الويب مباشرة (Web App). بمجرد إرسال الرابط للعميل يفتحه من أي هاتف (أندرويد أو آيفون) فوراً بدون الحاجة لتحميل شيء من متجر التطبيقات.
                </li>
                <li>
                  <b>رمز الاستجابة السريعة (QR Code):</b> يمكنك طباعة رمز الـ QR أدناه ولصقه على لافتة الصيدلية أو كاونتر الاستقبال أو أكياس الأدوية، فيقوم الزبون بمسحه بكاميرا هاتفه ليفتح المتجر مباشرة!
                </li>
                <li>
                  <b>واتساب وفيسبوك:</b> يمكنك إرسال الرسالة الجاهزة أدناه لأرقام الزبائن أو في جروبات الصيدلية.
                </li>
              </ul>
            </div>

            {/* QR Code preview */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="flex-1 text-right">
                <h5 className="font-bold text-xs text-[#0755b8] mb-1 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#f20c69]" />
                  <span>رمز QR Code الخاص بالصيدلية</span>
                </h5>
                <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                  امسح الرمز بكاميرا هاتفك لتجربة فتح متجر الصيدلية مباشرة، أو انقر لفتحه أو طباعته.
                </p>
                <a
                  href={qrCodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#0755b8] font-bold hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل الرمز بالحجم الكامل للطباعة</span>
                </a>
              </div>
              <div className="w-32 h-32 bg-white p-2 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-center shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="QR Code صيدلية د. هبه الشواربي"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Ready WhatsApp Promo Box */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>نص رسالة ترويجية جاهزة للواتساب</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(promoMessage, 'msg')}
                  className="text-[11px] bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMessage ? 'تم النسخ!' : 'نسخ الرسالة'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-700 whitespace-pre-line bg-white/80 p-2.5 rounded-xl border border-emerald-100 font-sans leading-relaxed">
                {promoMessage}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Install as PWA (Computer & Phone) */}
        {activeTab === 'pwaInstall' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. Direct Computer / PC Download & Installation */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 p-4 sm:p-5 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-emerald-950">
                    تحميل اختصار البرنامج المباشر لكمبيوتر الصيدلية (Desktop Shortcut)
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    يعمل فوراً على كافة أجهزة الكمبيوتر (Windows 7 / 8 / 10 / 11)
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed mb-3">
                اضغط على الزر الأخضر بالأسفل، وسيتم <b>تحميل ملف اختصار البرنامج فوراً</b> إلى مجلد التنزيلات بجهازك. انقله أو اسحبه إلى <b>سطح المكتب (Desktop)</b> ليصبح لديك تطبيق مثبت يفتح بنقرة واحدة!
              </p>

              {/* Download Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                <button
                  type="button"
                  onClick={handleDownloadShortcut}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-2.5 px-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل اختصار سطح المكتب (.url)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadLauncher}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-2.5 px-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                  title="يفتح كنافذة برنامج مستقل بدون شريط المتصفح"
                >
                  <span>⚡</span>
                  <span>تنزيل مشغل النافذة المستقلة (.bat)</span>
                </button>
              </div>

              {downloadSuccessMsg && (
                <div className="bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs p-2.5 rounded-xl font-bold mb-3 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{downloadSuccessMsg}</span>
                </div>
              )}

              {/* Method 2: Drag & Drop (Super Fast) */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs text-gray-700 space-y-1.5 mb-3">
                <p className="font-bold text-emerald-900 flex items-center gap-1">
                  <span>💡</span>
                  <span>طريقة السحب السريعة بالماوس (في 3 ثوانٍ فقط):</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 text-[11px] leading-relaxed">
                  <li>صغّر نافذة المتصفح قليلاً حتى يظهر سطح المكتب (Desktop) خلفها.</li>
                  <li>اضغط بالماوس باستمرار على علامة <b>القفل 🔒</b> أو أيقونة الكرة الأرضية بجانب الرابط أعلى المتصفح.</li>
                  <li><b>اسحبها بالماوس وأفلتها</b> على سطح المكتب، وستتحول فوراً إلى أيقونة برنامج دائمة!</li>
                </ol>
              </div>

              {/* Method 3: Chrome Menu */}
              <div className="bg-white/80 p-3 rounded-xl border border-blue-100 text-xs text-gray-600 space-y-1">
                <p className="font-bold text-[#0755b8]">أو من خلال إعدادات متصفح Chrome / Edge:</p>
                <p className="text-[11px] leading-relaxed">
                  اضغط على النقاط الثلاث <b>(⋮)</b> أعلى المتصفح ⬅ <b>المزيد من الأدوات (More Tools)</b> ⬅ <b>إنشاء اختصار (Create Shortcut)</b> ⬅ ضع علامة صح على <b>"فتح كنافذة" (Open as window)</b> ثم اضغط <b>إنشاء (Create)</b>.
                </p>
              </div>
            </div>

            {/* 2. Mobile Phone Installation */}
            <div className="bg-[#f8fbff] border border-[#dbeaff] p-4 rounded-2xl">
              <h4 className="font-bold text-sm text-[#0755b8] mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#f20c69]" />
                <span>تثبيت التطبيق على هواتف العملاء أو هاتف الصيدلي:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                  <p className="font-bold text-[#0755b8] mb-1.5">📱 هواتف أندرويد (Google Chrome):</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600 leading-relaxed text-[11px]">
                    <li>افتح رابط التطبيق في Chrome.</li>
                    <li>اضغط على النقاط الثلاث (⋮) أعلى الزاوية.</li>
                    <li>اختر <b>"تثبيت التطبيق"</b> أو <b>"إضافة إلى الشاشة الرئيسية"</b>.</li>
                  </ol>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
                  <p className="font-bold text-[#f20c69] mb-1.5">🍎 هواتف آيفون (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600 leading-relaxed text-[11px]">
                    <li>افتح رابط التطبيق في متصفح Safari.</li>
                    <li>اضغط على زر المشاركة (المربع بسهم لأعلى).</li>
                    <li>اختر <b>"إضافة إلى الشاشة الرئيسية"</b>.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                برنامج الكمبيوتر يعمل بكفاءة وخفة تامة، ويتزامن مباشرة مع المتجر ليرن جرس الطلبات الجديدة فور وصولها!
              </span>
            </div>
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
