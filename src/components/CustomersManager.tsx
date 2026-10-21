import React, { useState, useEffect } from 'react';
import { Order, RegisteredCustomer } from '../types';
import { fetchLocalCustomers, fetchRemoteCustomers, subscribeToCustomers } from '../services/api';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface CustomersManagerProps {
  orders: Order[];
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({ orders }) => {
  const [customers, setCustomers] = useState<RegisteredCustomer[]>(() => fetchLocalCustomers(orders));
  const [searchQuery, setSearchQuery] = useState('');

  // Reload customers whenever orders change or window event fires
  const reloadCustomers = () => {
    setCustomers(fetchLocalCustomers(orders));
  };

  useEffect(() => {
    reloadCustomers();
    fetchRemoteCustomers().then((remoteList) => {
      if (remoteList && remoteList.length > 0) {
        setCustomers(fetchLocalCustomers(orders));
      }
    });

    const unsub = subscribeToCustomers(() => {
      setCustomers(fetchLocalCustomers(orders));
    });

    const handleNewCust = () => reloadCustomers();
    window.addEventListener('new_customer_registered', handleNewCust);
    window.addEventListener('storage', handleNewCust);
    return () => {
      unsub();
      window.removeEventListener('new_customer_registered', handleNewCust);
      window.removeEventListener('storage', handleNewCust);
    };
  }, [orders]);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const totalOrdersPlaced = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
  const activeCustomersCount = customers.filter((c) => (c.totalOrders || 0) > 0).length;

  const handleOpenWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    const msg = `مرحباً بك يا ${name} في صيدلية د. هبه الشواربي! يسعدنا دائماً خدمتك وتلبية احتياجاتك العلاجية 🌸`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Stats */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(7,85,184,0.06)]">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0755b8] to-[#0866cf] text-white flex items-center justify-center font-bold shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0755b8]">
                👥 سجل ودليل العملاء المسجلين
              </h2>
              <p className="text-xs sm:text-sm text-[#47658a]">
                قائمة بجميع العملاء الذين سجلوا حساباتهم في تطبيق الصيدلية أو قاموا بالطلب.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>تسجيل العملاء نشط وتلقائي</span>
            </span>
          </div>
        </div>

        {/* Key KPI Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl">
            <span className="text-xs text-[#0755b8] font-bold block mb-1">إجمالي العملاء المسجلين</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#0755b8]">{customers.length}</span>
              <span className="text-xs text-blue-600 font-bold">عميل</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl">
            <span className="text-xs text-emerald-800 font-bold block mb-1">عملاء أتموا طلبات</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">{activeCustomersCount}</span>
              <span className="text-xs text-emerald-600 font-bold">عميل نشط</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-4 rounded-2xl">
            <span className="text-xs text-purple-800 font-bold block mb-1">إجمالي الطلبات المسجلة</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-700">{totalOrdersPlaced}</span>
              <span className="text-xs text-purple-600 font-bold">طلب ناجح</span>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-5 relative">
          <div className="flex items-center gap-2 bg-[#f4f7fc] border border-[#dce6f4] rounded-2xl px-3 py-2.5 focus-within:border-[#0755b8] focus-within:bg-white transition-all shadow-2xs">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم العميل أو رقم الموبايل أو الإيميل..."
              className="w-full bg-transparent border-none outline-none text-sm text-[#15345b] placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 text-xs px-2 cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customers List / Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0755b8] flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
            👥
          </div>
          <p className="font-bold text-[#15345b] text-base mb-1">لا توجد نتائج مطابقة للبحث</p>
          <p className="text-xs text-gray-400">
            بمجرد أن يُنشئ أي عميل حسابه أو يقوم بطلب دواء، سيظهر اسمه ورقمه هنا فوراً!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const initials = cust.fullName
              ? cust.fullName
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
              : 'ع';
            const dateStr = cust.registeredAt
              ? new Date(cust.registeredAt).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'حديثاً';

            return (
              <div
                key={cust.id}
                className="bg-white border border-[#e0ebf8] hover:border-[#0755b8]/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0755b8] to-[#f20c69] text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#15345b] line-clamp-1">
                          {cust.fullName}
                        </h4>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>انضم: {dateStr}</span>
                        </span>
                      </div>
                    </div>

                    <span className="bg-blue-50 text-[#0755b8] border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                      {cust.totalOrders ? `${cust.totalOrders} طلبات` : 'عميل مسجل'}
                    </span>
                  </div>

                  {/* Details Card */}
                  <div className="space-y-2 bg-[#f8fbfe] p-3 rounded-xl border border-gray-100 text-xs">
                    {/* Phone */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">رقم الهاتف:</span>
                      <span className="font-mono font-bold text-[#0755b8]" dir="ltr">
                        {cust.phone}
                      </span>
                    </div>

                    {/* Email */}
                    {cust.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">الإيميل:</span>
                        <span className="text-gray-700 font-mono text-[11px] truncate max-w-[170px]" dir="ltr">
                          {cust.email}
                        </span>
                      </div>
                    )}

                    {/* Address */}
                    {cust.address && (
                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-gray-200/60">
                        <span className="text-gray-400 flex-shrink-0">العنوان:</span>
                        <span className="text-gray-700 text-right text-[11px] line-clamp-1">
                          {cust.address}
                        </span>
                      </div>
                    )}

                    {/* Total spent if has orders */}
                    {cust.totalSpent !== undefined && cust.totalSpent > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 font-bold text-emerald-800">
                        <span>إجمالي الطلبات:</span>
                        <span>{cust.totalSpent.toFixed(2)} ج.م</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Communication Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(cust.phone, cust.fullName)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                    title="محادثة واتساب مباشرة مع العميل"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>مراسلة واتساب</span>
                  </button>

                  <a
                    href={`tel:${cust.phone}`}
                    className="flex items-center justify-center gap-1 bg-[#f0f6ff] hover:bg-[#e0efff] text-[#0755b8] border border-[#d6e7fc] font-bold py-2 px-3 rounded-xl text-xs transition-colors"
                    title="اتصال هاتفي بالعميل"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
