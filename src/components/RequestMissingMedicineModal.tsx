import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, Phone, User, FileText, Send } from 'lucide-react';
import { AuthSession, CustomerProfile } from '../types';
import { recordMissingMedicineRequest } from '../services/api';

interface RequestMissingMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMedicineName?: string;
  session?: AuthSession | null;
  profile?: CustomerProfile | null;
  onSuccess?: () => void;
}

export const RequestMissingMedicineModal: React.FC<RequestMissingMedicineModalProps> = ({
  isOpen,
  onClose,
  initialMedicineName = '',
  session,
  profile,
  onSuccess
}) => {
  const [medicineName, setMedicineName] = useState(initialMedicineName);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMedicineName(initialMedicineName);
      setCustomerName(profile?.full_name || '');
      setCustomerPhone(profile?.phone || '');
      setNotes('');
      setIsSubmitted(false);
      setError(null);
    }
  }, [isOpen, initialMedicineName, profile]);

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) {
      setError('يرجى كتابة اسم الدواء المطلوب.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setError('يرجى كتابة رقم موبايل صحيح حتى نتمكن من التواصل معك فور توفر الدواء.');
      return;
    }

    recordMissingMedicineRequest({
      medicineName: medicineName.trim(),
      customerName: customerName.trim() || 'عميل في الصيدلية',
      customerPhone: customerPhone.trim(),
      notes: notes.trim(),
      source: 'search'
    });

    setIsSubmitted(true);
    if (onSuccess) onSuccess();

    setTimeout(() => {
      onClose();
    }, 2200);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#071b2a]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#dce9f8] relative animate-in fade-in zoom-in-95 duration-200"
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

        {isSubmitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-black text-[#102a43]">تم استلام طلب توفير الدواء بنجاح!</h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
              تم إشعار إدارة صيدلية د. هبه الشواربي بطلبك لدواء <b>"{medicineName}"</b>، وسنقوم بتأمينه والتواصل معك هاتفياً أو عبر واتساب فور وصوله.
            </p>
            <span className="inline-block bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
              شكراً لثقتكم بصيدلية د. هبه الشواربي 🌸
            </span>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f20c69] to-[#d8085b] text-white flex items-center justify-center font-bold text-xl shadow-md">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#0755b8]">طلب توفير دواء غير متوفر</h3>
                <p className="text-xs text-[#56769f]">
                  لم تجد دواءك؟ سجّل بياناتك وسنوفره لك ونبلغك فوراً
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  اسم الدواء المطلوب: <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-[#f8fbfe] border border-[#d8e5f5] rounded-xl px-3 py-2 focus-within:border-[#0755b8] focus-within:bg-white transition-all">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    placeholder="اسم الدواء أو المادة الفعالة..."
                    className="w-full bg-transparent border-none outline-none text-sm text-[#15345b] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  اسمك الكريم:
                </label>
                <div className="flex items-center gap-2 bg-[#f8fbfe] border border-[#d8e5f5] rounded-xl px-3 py-2 focus-within:border-[#0755b8] focus-within:bg-white transition-all">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="اسم العميل"
                    className="w-full bg-transparent border-none outline-none text-sm text-[#15345b] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  رقم الموبايل للتواصل والواتساب: <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-[#f8fbfe] border border-[#d8e5f5] rounded-xl px-3 py-2 focus-within:border-[#0755b8] focus-within:bg-white transition-all">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    dir="ltr"
                    className="w-full bg-transparent border-none outline-none text-sm text-[#15345b] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ملاحظات أو الكمية المطلوبة (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: محتاج علبتين ضروري، أو تركيز 10 مجم..."
                  className="w-full bg-[#f8fbfe] border border-[#d8e5f5] rounded-xl p-3 text-xs outline-none focus:border-[#0755b8] focus:bg-white font-medium"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all border border-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  style={{
                    backgroundColor: '#f20c69',
                    backgroundImage: 'linear-gradient(135deg, #f20c69 0%, #d8085b 100%)'
                  }}
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال طلب التوفير للصيدلية فوراً</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
