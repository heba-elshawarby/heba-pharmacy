import React, { useState, useEffect } from 'react';
import { MissingMedicineRequest, Medicine } from '../types';
import {
  fetchMissingMedicineRequests,
  updateMissingMedicineStatus,
  deleteMissingMedicineRequest,
  recordMissingMedicineRequest
} from '../services/api';
import {
  Bell,
  Search,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Trash2,
  PlusCircle,
  Calendar,
  User,
  AlertTriangle,
  ArrowRight,
  Filter,
  PackagePlus
} from 'lucide-react';

interface MissingMedicinesManagerProps {
  onOpenInventoryForMedicine?: (medicineName: string) => void;
}

export const MissingMedicinesManager: React.FC<MissingMedicinesManagerProps> = ({
  onOpenInventoryForMedicine
}) => {
  const [requests, setRequests] = useState<MissingMedicineRequest[]>(() => fetchMissingMedicineRequests());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'fulfilled'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  const reloadRequests = () => {
    setRequests(fetchMissingMedicineRequests());
  };

  useEffect(() => {
    reloadRequests();
    const handleUpdated = () => reloadRequests();
    window.addEventListener('missing_medicine_requested', handleUpdated);
    window.addEventListener('missing_medicine_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('missing_medicine_requested', handleUpdated);
      window.removeEventListener('missing_medicine_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  const handleToggleStatus = (id: string, currentStatus: MissingMedicineRequest['status']) => {
    const nextStatus = currentStatus === 'fulfilled' ? 'pending' : 'fulfilled';
    const updated = updateMissingMedicineStatus(id, nextStatus);
    setRequests(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل تريد حذف هذا الطلب من سجل النواقص؟')) {
      const updated = deleteMissingMedicineRequest(id);
      setRequests(updated);
    }
  };

  const handleWhatsAppContact = (req: MissingMedicineRequest, customMessage?: string) => {
    const cleanPhone = (req.customerPhone || '').replace(/[^\d]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    const defaultMsg = req.status === 'fulfilled'
      ? `أهلاً بك يا ${req.customerName} في صيدلية د. هبه الشواربي! 🌸\nيسعدنا إخبارك بأن دواء "${req.medicineName}" الذي بحثت عنه وطلبته أصبح متوفراً الآن في الصيدلية، ويمكننا توصيله لك فوراً لباب منزلك 🛵.`
      : `مرحباً يا ${req.customerName} من صيدلية د. هبه الشواربي 💊.\nنتواصل معك بخصوص بحثك عن دواء "${req.medicineName}"، جاري العمل على توفيره وسنبلغك فور وصوله.`;

    const msg = customMessage || defaultMsg;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    recordMissingMedicineRequest({
      medicineName: newMedName.trim(),
      customerName: newCustName.trim() || 'عميل في الصيدلية',
      customerPhone: newCustPhone.trim(),
      notes: newCustNotes.trim(),
      source: 'direct'
    });

    setNewMedName('');
    setNewCustName('');
    setNewCustPhone('');
    setNewCustNotes('');
    setShowAddModal(false);
    reloadRequests();
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.medicineName.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.customerPhone.includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const fulfilledCount = requests.filter((r) => r.status === 'fulfilled').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Stats */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(7,85,184,0.06)]">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f20c69] to-[#d8085b] text-white flex items-center justify-center font-bold shadow-md">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#0755b8]">
                  📋 طلبات توفير الأدوية ونواقص العملاء
                </h2>
                {pendingCount > 0 && (
                  <span className="bg-[#f20c69] text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse">
                    {pendingCount} دواء ناقص
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#47658a]">
                سجل ذكي للأدوية التي بحث عنها العملاء ولم يجدوها أو تم طلبها عبر الروشتات، لتوفيرها والتواصل معهم فوراً.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-[#0755b8] hover:bg-[#06479b] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل دواء ناقص يدوياً</span>
          </button>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 p-4 rounded-2xl">
            <span className="text-xs text-rose-800 font-bold block mb-1">أدوية مطلوبة بانتظار التوفير</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-700">{pendingCount}</span>
              <span className="text-xs text-rose-600 font-bold">طلب معلق</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl">
            <span className="text-xs text-emerald-800 font-bold block mb-1">أدوية تم توفيرها بنجاح</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">{fulfilledCount}</span>
              <span className="text-xs text-emerald-600 font-bold">تم توفيرها</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl">
            <span className="text-xs text-[#0755b8] font-bold block mb-1">إجمالي طلبات وبحوث النواقص</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#0755b8]">{requests.length}</span>
              <span className="text-xs text-blue-600 font-bold">طلب مسجل</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <div className="flex items-center gap-2 bg-[#f4f7fc] border border-[#dce6f4] rounded-2xl px-3 py-2.5 focus-within:border-[#0755b8] focus-within:bg-white transition-all shadow-2xs">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الدواء المطلوب أو اسم العميل أو الموبايل..."
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#f0f5fc] p-1 rounded-2xl border border-[#dce8f7] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#0755b8] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-white/60'
              }`}
            >
              الكل ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-white/60'
              }`}
            >
              معلق ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('fulfilled')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'fulfilled'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-white/60'
              }`}
            >
              تم التوفير ({fulfilledCount})
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0755b8] flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
            💊
          </div>
          <p className="font-bold text-[#15345b] text-base mb-1">لا توجد طلبات نواقص مسجلة حالياً</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            عندما يبحث أي عميل عن دواء غير متوفر ويطلب توفيره، أو عند تحليل روشتة تحتوي على أدوية ناقصة، ستظهر بيانات العميل والدواء هنا فوراً مع أزرار تواصل واتساب واتصال سريعة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const isFulfilled = req.status === 'fulfilled';
            const dateStr = new Date(req.createdAt).toLocaleDateString('ar-EG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={req.id}
                className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  isFulfilled
                    ? 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50/20'
                    : 'border-rose-200 bg-gradient-to-b from-white to-rose-50/20 ring-1 ring-rose-200/50'
                }`}
              >
                <div>
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                        isFulfilled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {isFulfilled ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تم توفيره في الصيدلية</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                          <span>بانتظار الشراء والتوفير</span>
                        </>
                      )}
                    </span>

                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </span>
                  </div>

                  {/* Medicine Name Block */}
                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-gray-400 block mb-0.5">الدواء المطلوب:</span>
                    <h3 className="font-black text-base sm:text-lg text-[#102a43] leading-snug">
                      {req.medicineName}
                    </h3>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-[#f8fbfe] border border-[#e5effa] rounded-2xl p-3 space-y-1.5 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>العميل:</span>
                      </span>
                      <b className="text-[#15345b]">{req.customerName}</b>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>الهاتف:</span>
                      </span>
                      <a
                        href={`tel:${req.customerPhone}`}
                        className="font-mono font-bold text-[#0755b8] hover:underline"
                        dir="ltr"
                      >
                        {req.customerPhone || 'غير مدون'}
                      </a>
                    </div>

                    {req.notes && (
                      <div className="pt-1.5 border-t border-gray-200/60 text-[11px] text-gray-600">
                        <span className="text-gray-400">ملاحظة: </span>
                        <span>"{req.notes}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  {/* WhatsApp and Phone direct buttons */}
                  <div className="flex items-center gap-2">
                    {req.customerPhone && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleWhatsAppContact(req)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title="محادثة واتساب مباشرة مع العميل"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>مراسلة واتساب</span>
                        </button>

                        <a
                          href={`tel:${req.customerPhone}`}
                          className="bg-[#f0f6ff] hover:bg-[#e1eeff] text-[#0755b8] border border-[#d2e4f8] text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-colors"
                          title="اتصال هاتفي بالعميل"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصال</span>
                        </a>
                      </>
                    )}
                  </div>

                  {/* Toggle Status and Inventory Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(req.id, req.status)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                        isFulfilled
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isFulfilled ? 'إعادة إلى معلق' : 'تحديد كـ تم التوفير ✓'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {onOpenInventoryForMedicine && (
                        <button
                          type="button"
                          onClick={() => onOpenInventoryForMedicine(req.medicineName)}
                          className="text-[#0755b8] hover:bg-blue-50 p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="إضافة هذا الدواء للمخزون"
                        >
                          <PackagePlus className="w-4 h-4 text-[#0755b8]" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(req.id)}
                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Missing Medicine Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-[#071b2a]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#dce9f8] animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="font-black text-lg text-[#0755b8] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#f20c69]" />
                <span>تسجيل طلب دواء ناقص</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 flex items-center justify-center cursor-pointer transition-colors border border-gray-200 shadow-2xs font-bold"
                title="إغلاق (X)"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  اسم الدواء المطلوب: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="مثال: كونكور 5 مجم أو كتافلام أقراص..."
                  className="w-full bg-[#f8fbfe] border border-[#d8e5f5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0755b8] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  اسم العميل:
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="اسم العميل (اختياري)"
                  className="w-full bg-[#f8fbfe] border border-[#d8e5f5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0755b8] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  رقم هاتف العميل:
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="مثال: 01012345678"
                  dir="ltr"
                  className="w-full bg-[#f8fbfe] border border-[#d8e5f5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0755b8] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ملاحظات أو الكمية المطلوبة:
                </label>
                <textarea
                  rows={2}
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="مثال: محتاج علبتين ضروري..."
                  className="w-full bg-[#f8fbfe] border border-[#d8e5f5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0755b8] font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0755b8] hover:bg-[#06479b] text-white font-bold py-2.5 rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  حفظ في النواقص
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
