import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Phone,
  MessageSquare,
  Building,
  Sparkles,
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { getPharmacyLogo, savePharmacyLogo } from '../services/api';
import { DEFAULT_PHARMACY_LOGO } from '../constants/logo';

export const PharmacySettingsTab: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => getPharmacyLogo());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pharmacy contact info
  const [pharmacyName, setPharmacyName] = useState(() => {
    return localStorage.getItem('shawarbi_pharmacy_name') || 'صيدلية د. هبه الشواربي';
  });
  const [pharmacyPhone, setPharmacyPhone] = useState(() => {
    return localStorage.getItem('shawarbi_pharmacy_phone') || '01000000000';
  });
  const [pharmacyWhatsapp, setPharmacyWhatsapp] = useState(() => {
    return localStorage.getItem('shawarbi_pharmacy_whatsapp') || '01000000000';
  });
  const [pharmacyAddress, setPharmacyAddress] = useState(() => {
    return localStorage.getItem('shawarbi_pharmacy_address') || 'شارع الصيدلية الرئيسي - خدمة 24 ساعة';
  });

  const clientUrl = window.location.origin + '/';
  const adminUrl = window.location.origin + '/#admin';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoUrl(result);
      savePharmacyLogo(result);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (confirm('هل أنت متأكد من حذف الشعار المخصص واستعادة الشعار الافتراضي؟')) {
      setLogoUrl(null);
      savePharmacyLogo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const handleSaveContactInfo = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('shawarbi_pharmacy_name', pharmacyName);
    localStorage.setItem('shawarbi_pharmacy_phone', pharmacyPhone);
    localStorage.setItem('shawarbi_pharmacy_whatsapp', pharmacyWhatsapp);
    localStorage.setItem('shawarbi_pharmacy_address', pharmacyAddress);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Alert banner on save */}
      {saveSuccess && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm">
              تم حفظ التغييرات بنجاح! تظهر التحديثات الآن فوراً في واجهة العميل ولوحة الإدارة.
            </span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">محدث الآن</span>
        </div>
      )}

      {/* SECTION 1: LOGO UPLOADER */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-black text-[#0755b8] flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-[#f20c69]" />
              <span>شعار الصيدلية (Logo)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              ارفع لوجو الصيدلية ليظهر لعملائك في أعلى المتجر، ولوحة التحكم، ورأس الفواتير والروشتات.
            </p>
          </div>
          {logoUrl && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إزالة الشعار والعودة للافتراضي</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          {/* Logo Previews */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#f8faff] to-[#eef4fc] border border-blue-100 rounded-2xl text-center">
            <p className="text-xs font-bold text-[#0755b8] mb-3">معاينة الشعار الحالي في المتجر</p>
            
            {/* Circular Preview (Header style) */}
            <div className="w-24 h-24 rounded-full bg-white border-4 border-[#f3d5e2] shadow-[0_6px_20px_rgba(7,85,184,0.15)] flex items-center justify-center overflow-hidden mb-3 p-1">
              <img
                src={logoUrl || DEFAULT_PHARMACY_LOGO}
                alt="شعار الصيدلية"
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs font-bold text-gray-800">
              {logoUrl ? 'شعار مخصص نشط ✅' : 'الشعار الطبي الافتراضي'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {logoUrl
                ? 'يظهر الآن لجميع زوار ومتصفحي المتجر'
                : 'يمكنك رفع صورة الشعار من الزر المجاور'}
            </p>
          </div>

          {/* Upload Controls */}
          <div className="md:col-span-7 space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              className="hidden"
              id="pharmacy-logo-input"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#0755b8]/30 hover:border-[#f20c69] bg-blue-50/40 hover:bg-pink-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-[#0755b8]/10 group-hover:bg-[#f20c69]/10 text-[#0755b8] group-hover:text-[#f20c69] flex items-center justify-center mb-3 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-black text-[#0755b8] group-hover:text-[#f20c69] transition-colors">
                اضغط هنا لاختيار صورة اللوجو من جهازك أو هاتفك
              </p>
              <p className="text-xs text-gray-500 mt-1">
                يدعم صيغ PNG (يُفضل بخلفية شفافة) أو JPG أو WEBP أو SVG
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0755b8] hover:bg-[#06479b] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>اختر صورة الشعار</span>
              </button>

              <span className="text-xs text-gray-500">
                💡 نصيحة: يمكنك أيضاً سحب وإفلات صورة الشعار في شات المحادثة وسنقوم بدمجها فوراً!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: HOW TO SHARE & PUT IN PEOPLE'S HANDS */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-black text-[#0755b8] flex items-center gap-2 mb-2">
          <Smartphone className="w-6 h-6 text-[#f20c69]" />
          <span>كيف تجعل التطبيق في أيدي الناس وتختبره معهم؟ (دليل مبسط)</span>
        </h2>
        <p className="text-xs text-gray-600 mb-6">
          التطبيق يعمل بتقنية حديثة تتيح لأي شخص استخدامه فوراً عبر الرابط أو تثبيته كأيقونة تطبيق حقيقية على الموبايل بلمسة واحدة:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#0755b8] text-white font-black flex items-center justify-center text-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-[#0755b8]">أرسل الرابط للعملاء أو الأصدقاء</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              انسخ رابط واجهة العميل وشاركه على واتساب أو ماسنجر مع أي شخص لتجربته.
            </p>
          </div>

          <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#f20c69] text-white font-black flex items-center justify-center text-sm">
              2
            </div>
            <h4 className="font-bold text-sm text-[#f20c69]">تثبيته كـ App على شاشة الموبايل</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              عند فتح الرابط في المتصفح، يضغط العميل على <b>(إضافة إلى الشاشة الرئيسية Add to Home screen)</b> فيصبح تطبيقاً بأيقونة على هاتفه!
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
              3
            </div>
            <h4 className="font-bold text-sm text-emerald-800">استقبال الطلبات ومتابعتها</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              أي طلب يرسله العميل يظهر لك فوراً في تبويب <b>طلبات العملاء الواردة</b> لتجهيزه وتغيير حالته.
            </p>
          </div>
        </div>

        {/* Quick Link Copy Boxes */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-2xl flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛒</span>
              <div>
                <p className="text-xs font-bold text-gray-900">رابط واجهة العميل (المتجر العام للجمهور)</p>
                <code className="text-[11px] text-[#0755b8] break-all">{clientUrl}</code>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(clientUrl, 'client')}
                className="bg-[#0755b8] hover:bg-[#06479b] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                {copiedLink === 'client' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'client' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
              <a
                href={clientUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح</span>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-2xl flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <div>
                <p className="text-xs font-bold text-gray-900">رابط لوحة تحكم الإدارة (خاص بالصيدلي)</p>
                <code className="text-[11px] text-[#0755b8] break-all">{adminUrl}</code>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(adminUrl, 'admin')}
                className="bg-[#f20c69] hover:bg-[#d8085b] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                {copiedLink === 'admin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'admin' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PHARMACY CONTACT SETTINGS */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-black text-[#0755b8] flex items-center gap-2 mb-2">
          <Building className="w-6 h-6 text-[#0755b8]" />
          <span>بيانات الصيدلية والتواصل مع العملاء</span>
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          تظهر هذه البيانات للعملاء في رأس الصفحة وأسفل الموقع وعند إرسال الروشتات والطلبات.
        </p>

        <form onSubmit={handleSaveContactInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم الصيدلية الرسمي</label>
              <input
                type="text"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#0755b8] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                رقم واتساب الصيدلية (لاستقبال الروشتات)
              </label>
              <input
                type="tel"
                value={pharmacyWhatsapp}
                onChange={(e) => setPharmacyWhatsapp(e.target.value)}
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#0755b8] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف الأرضي / الموبايل</label>
              <input
                type="tel"
                value={pharmacyPhone}
                onChange={(e) => setPharmacyPhone(e.target.value)}
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#0755b8] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">عنوان وموقع الصيدلية</label>
              <input
                type="text"
                value={pharmacyAddress}
                onChange={(e) => setPharmacyAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#0755b8] outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="bg-[#0755b8] hover:bg-[#06479b] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ بيانات الصيدلية</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
