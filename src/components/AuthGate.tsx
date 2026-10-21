import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { loginWithPassword, signupCustomer } from '../services/api';
import { AuthSession } from '../types';

interface AuthGateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !email.includes('@')) {
      setMessage({ text: 'يرجى كتابة بريد إلكتروني صحيح.', isError: true });
      return;
    }
    if (password.length < 8) {
      setMessage({ text: 'كلمة المرور يجب ألا تقل عن 8 أحرف.', isError: true });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        if (fullName.trim().length < 2) {
          setMessage({ text: 'يرجى كتابة اسم العميل بالكامل.', isError: true });
          setLoading(false);
          return;
        }
        if (!/^[-+()\s\d]{7,20}$/.test(phone.trim())) {
          setMessage({ text: 'يرجى كتابة رقم موبايل صحيح.', isError: true });
          setLoading(false);
          return;
        }

        const session = await signupCustomer(email.trim(), password, fullName.trim(), phone.trim());
        setMessage({ text: 'تم إنشاء الحساب بنجاح!', isError: false });
        setTimeout(() => {
          onSuccess(session);
          onClose();
        }, 600);
      } else {
        const session = await loginWithPassword(email.trim(), password);
        setMessage({ text: 'تم تسجيل الدخول بنجاح!', isError: false });
        setTimeout(() => {
          onSuccess(session);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'حدث خطأ. حاول مرة أخرى.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email || !email.includes('@')) {
      setMessage({ text: 'اكتب بريدك الإلكتروني أولاً في الحقل أعلاه.', isError: true });
      return;
    }
    setMessage({
      text: 'إذا كان البريد مسجلاً، فستصلك رسالة لاستعادة كلمة المرور.',
      isError: false
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#071b2a]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-[#dce9f8] animate-in fade-in zoom-in-95 duration-200"
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

        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#fff0f6] text-[#d83b82] mx-auto flex items-center justify-center text-3xl font-black mb-3 border border-[#f3d5e2]">
            ✚
          </div>
          <h2 className="text-xl font-black text-[#102a43]">صيدلية د. هبه الشواربي</h2>
          <p className="text-xs text-[#687b8b] mt-1">سجّل الدخول أو أنشئ حسابك لمتابعة طلباتك</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 p-1 bg-[#f6f8fb] border border-[#dfe6ec] rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login' ? 'bg-[#f20c69] text-white shadow-sm' : 'text-[#102a43] hover:text-[#f20c69]'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signup' ? 'bg-[#f20c69] text-white shadow-sm' : 'text-[#102a43] hover:text-[#f20c69]'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
              message.isError
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}
          >
            {message.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#102a43] mb-1">الاسم بالكامل *</label>
                <div className="flex items-center gap-2 border border-[#dfe6ec] rounded-xl px-3 py-2 bg-[#fcfdff]">
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اسم العميل"
                    className="w-full text-xs sm:text-sm outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102a43] mb-1">رقم الموبايل *</label>
                <div className="flex items-center gap-2 border border-[#dfe6ec] rounded-xl px-3 py-2 bg-[#fcfdff]">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full text-xs sm:text-sm outline-none bg-transparent"
                    dir="ltr"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#102a43] mb-1">البريد الإلكتروني *</label>
            <div className="flex items-center gap-2 border border-[#dfe6ec] rounded-xl px-3 py-2 bg-[#fcfdff]">
              <Mail className="w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs sm:text-sm outline-none bg-transparent"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#102a43] mb-1">كلمة المرور *</label>
            <div className="flex items-center gap-2 border border-[#dfe6ec] rounded-xl px-3 py-2 bg-[#fcfdff]">
              <Lock className="w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                className="w-full text-xs sm:text-sm outline-none bg-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#f20c69] hover:bg-[#d8085b] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all shadow-[0_5px_15px_rgba(242,12,105,0.25)] text-sm cursor-pointer"
          >
            {loading ? 'جارٍ التنفيذ...' : mode === 'signup' ? 'إنشاء الحساب' : 'تسجيل الدخول'}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-xs text-[#0755b8] font-bold text-center hover:underline pt-1 cursor-pointer"
            >
              نسيت كلمة المرور؟
            </button>
          )}
        </form>

        <p className="text-[11px] text-[#687b8b] text-center mt-4 leading-relaxed">
          بياناتك تستخدم لإنشاء حسابك ومتابعة طلباتك بأمان لدى صيدلية د. هبه الشواربي.
        </p>
      </div>
    </div>
  );
};
