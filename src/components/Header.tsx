import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, LogOut, Camera } from 'lucide-react';
import { AuthSession, CustomerProfile } from '../types';
import { getPharmacyLogo } from '../services/api';
import { DEFAULT_PHARMACY_LOGO } from '../constants/logo';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  session: AuthSession | null;
  profile: CustomerProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onOpenLinks?: () => void;
  onScrollToOrders: () => void;
  onOpenPrescription?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  session,
  profile,
  onOpenAuth,
  onLogout,
  onScrollToOrders,
  onOpenPrescription
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
    <header className="bg-white border-b border-[#dbeaff] shadow-[0_4px_18px_rgba(7,85,184,0.06)] sticky top-0 z-40">
      {/* Main Customer Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-[#f3d5e2] shadow-[0_4px_16px_rgba(7,85,184,0.12)] flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
              <img
                src={logoUrl || DEFAULT_PHARMACY_LOGO}
                alt="شعار صيدلية د. هبه الشواربي"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0755b8] leading-tight">
                صيدلية د. هبه الشواربي
              </h1>
              <p className="text-xs sm:text-sm font-bold text-[#f20c69]">خدمتك الدوائية بسهولة وأمان</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Upload Prescription Button */}
            {onOpenPrescription && (
              <button
                type="button"
                onClick={onOpenPrescription}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-white px-3 sm:px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer border border-emerald-300 active:scale-95 hover:brightness-110"
                style={{
                  backgroundColor: '#059669',
                  backgroundImage: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  color: '#ffffff'
                }}
                title="فحص وقراءة روشتة الطبيب بالذكاء الاصطناعي"
              >
                <Camera className="w-4 h-4 text-white" />
                <span className="whitespace-nowrap font-bold">ارفع روشتة</span>
              </button>
            )}

            {/* My Orders quick button */}
            <button
              type="button"
              onClick={onScrollToOrders}
              className="text-xs sm:text-sm font-bold text-[#0755b8] hover:bg-[#f0f6ff] border border-[#dbeaff] px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              📦 طلباتي
            </button>

            {/* User Account */}
            {session ? (
              <div className="flex items-center gap-2 bg-[#f0f6ff] border border-[#dbeaff] px-3 py-1.5 rounded-xl text-xs sm:text-sm">
                <div className="w-7 h-7 rounded-full bg-[#0755b8] text-white flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="font-bold text-[#0755b8] leading-tight text-xs">
                    {profile?.full_name || session.user.email}
                  </p>
                  {profile?.customer_number && (
                    <p className="text-[10px] text-gray-500">رقم العميل: {profile.customer_number}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="text-gray-400 hover:text-[#f20c69] p-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-[#f0f6ff] hover:bg-[#e1eeff] text-[#0755b8] border border-[#dbeaff] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-[#0755b8]" />
                <span>حسابي</span>
              </button>
            )}

            {/* Cart Trigger */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-[#0755b8] hover:bg-[#06479b] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-[0_4px_12px_rgba(7,85,184,0.25)] transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">السلة</span>
              <span className="bg-[#f20c69] text-white text-xs font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
