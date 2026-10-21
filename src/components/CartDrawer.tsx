import React, { useState, useEffect } from 'react';
import { CartItem, AuthSession } from '../types';
import { X, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  session: AuthSession | null;
  onSubmitOrder: (formData: {
    name: string;
    phone: string;
    address: string;
    notes: string;
  }) => Promise<void>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  session,
  onSubmitOrder
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!items.length) {
      setErrorMsg('السلة فارغة، أضف بعض الأدوية أولاً.');
      return;
    }
    if (name.trim().length < 2) {
      setErrorMsg('يرجى كتابة الاسم بالكامل.');
      return;
    }
    if (!/^[-+()\s\d]{7,20}$/.test(phone.trim())) {
      setErrorMsg('يرجى كتابة رقم هاتف صحيح للتواصل.');
      return;
    }
    if (address.trim().length < 5) {
      setErrorMsg('يرجى كتابة العنوان بالتفصيل لتوصيل الطلب.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitOrder({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim()
      });
      setSubmitted(true);
      onClearCart();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      onClick={handleResetAndClose}
      className="fixed inset-0 z-50 bg-[#082345]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-2 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg max-h-[92vh] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#eaf4ff] text-[#0755b8] flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-[#0755b8]">
              {submitted ? 'حالة الطلب' : 'مراجعة وإرسال الطلب'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-gray-600 cursor-pointer border border-gray-200 shadow-2xs transition-colors"
            title="إغلاق (X)"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 py-4 pr-1">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-[#16845d] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-[#0755b8] mb-2">تم استلام طلبك بنجاح ✅</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-xs mx-auto">
                تم إرسال الطلب إلى صيدلية د. هبه الشواربي. سيقوم الصيدلي بمراجعة الأدوية والتواصل معك لتأكيد التوصيل.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full bg-[#0755b8] hover:bg-[#06479b] text-white font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                العودة للأدوية
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              {items.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">سلة الأدوية فارغة.</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 bg-[#f8fbff] border border-[#e5effa] rounded-2xl"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#15345b] truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.unitLabel} — {item.price.toFixed(2)} ج.م للوحدة
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm min-w-[20px] text-center text-[#0755b8]">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, 1)}
                          disabled={item.qty >= item.maxStock}
                          className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total for item & Delete */}
                      <div className="text-left flex items-center gap-2">
                        <span className="font-bold text-xs text-[#0755b8]">
                          {(item.price * item.qty).toFixed(2)} ج.م
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-gray-400 hover:text-[#f20c69] p-1 transition-colors cursor-pointer"
                          title="حذف الدواء"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total Box */}
                  <div className="p-3.5 bg-[#eaf4ff] border border-[#dbeaff] rounded-2xl flex items-center justify-between text-[#0755b8] font-bold">
                    <span>إجمالي الطلب:</span>
                    <span className="text-lg font-black">{total.toFixed(2)} ج.م</span>
                  </div>
                </div>
              )}

              {/* Checkout Form */}
              {items.length > 0 && (
                <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-gray-100">
                  <h4 className="font-bold text-sm text-[#0755b8]">بيانات استلام الطلب</h4>

                  {session ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      <span>مسجل بحساب: <b>{session.user.email}</b> — سيتم ربط الطلب بحسابك تلقائياً.</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                      ℹ️ يمكنك إرسال الطلب مباشرة وسنقوم بتسجيله والتواصل معك لتأكيده.
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">الاسم بالكامل *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اسم مستلم الطلب"
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#0755b8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">رقم الموبايل *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#0755b8] outline-none"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">عنوان التوصيل بالتفصيل *</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="المنطقة، الشارع، رقم العمارة، الشقة أو العلامة المميزة"
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#0755b8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات للصيدلية (اختياري)</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أي تعليمات خاصة بالجرعة أو موعد التوصيل..."
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#0755b8] outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-[#f20c69] hover:bg-[#d8085b] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all shadow-[0_5px_15px_rgba(242,12,105,0.25)] cursor-pointer text-sm"
                  >
                    {isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال الطلب للصيدلية'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
