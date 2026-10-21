import React, { useState } from 'react';
import { Order } from '../types';
import { saveLocalOrders, updateRemoteOrderStatus } from '../services/api';
import { ClipboardList, Phone, MapPin, Clock, Calendar, Check, AlertCircle, MessageCircle } from 'lucide-react';

interface AdminOrdersManagerProps {
  orders: Order[];
  onUpdateOrders: (updated: Order[]) => void;
  onRefresh: () => void;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  orders,
  onUpdateOrders,
  onRefresh
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  const handleStatusChange = (orderId: string | number, newStatus: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    onUpdateOrders(updated);
    saveLocalOrders(updated);
    updateRemoteOrderStatus(orderId, newStatus);
  };

  const statusArabicMap: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: 'جديد', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    processing: { label: 'قيد التجهيز', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    shipped: { label: 'تم الشحن', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    completed: { label: 'مكتمل', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    cancelled: { label: 'ملغي', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(7,85,184,0.06)]">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0755b8] text-white flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0755b8]">
                📋 إدارة الطلبات الواردة للصيدلية
              </h2>
              <p className="text-xs sm:text-sm text-[#47658a]">
                متابعة وتحديث حالات طلبات التوصيل الواردة من العملاء.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="bg-[#f0f6ff] hover:bg-[#e1eeff] text-[#0755b8] border border-[#dbeaff] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              تحديث الطلبات
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 flex-wrap mt-4">
          {[
            { id: 'all', label: 'جميع الطلبات' },
            { id: 'new', label: 'الطلبات الجديدة' },
            { id: 'processing', label: 'قيد التجهيز' },
            { id: 'shipped', label: 'تم الشحن' },
            { id: 'completed', label: 'المكتملة' },
            { id: 'cancelled', label: 'الملغية' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-[#0755b8] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe8f8] text-[#0755b8] hover:bg-[#f5f9ff]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 font-medium">
            لا توجد طلبات مطابقة لهذا الفلتر.
          </div>
        ) : (
          filtered.map((order) => {
            const st = statusArabicMap[order.status] || {
              label: order.status,
              color: 'text-gray-700',
              bg: 'bg-gray-50 border-gray-200'
            };
            const dateStr = order.created_at
              ? new Date(order.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '';

            return (
              <div
                key={order.id}
                className="bg-white border border-[#e0ebf8] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base text-[#15345b]">طلب #{order.id}</h4>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${st.bg} ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </p>
                  </div>

                  {/* Status Changer dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">تغيير الحالة:</span>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as Order['status'])
                      }
                      className="border border-gray-300 rounded-xl px-2.5 py-1 text-xs font-bold text-[#0755b8] bg-white outline-none cursor-pointer"
                    >
                      <option value="new">جديد</option>
                      <option value="processing">قيد التجهيز</option>
                      <option value="shipped">تم الشحن</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-xs bg-[#f8fbfe] p-3 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block mb-0.5">اسم العميل:</span>
                    <b className="text-gray-800 text-sm">{order.customer_name}</b>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">رقم الهاتف والتواصل:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="text-[#0755b8] font-bold flex items-center gap-1 hover:underline"
                        dir="ltr"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.customer_phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/${(order.customer_phone || '').replace(/[^\d]/g, '').startsWith('0') ? '2' + (order.customer_phone || '').replace(/[^\d]/g, '') : (order.customer_phone || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(`أهلاً بك يا ${order.customer_name}، نتواصل معك بخصوص طلبك رقم ${order.id} من صيدلية د. هبه الشواربي.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="محادثة واتساب"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>واتساب</span>
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">العنوان:</span>
                    <span className="text-gray-800 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{order.address}</span>
                    </span>
                  </div>
                  {order.notes && (
                    <div className="sm:col-span-3 pt-2 border-t border-gray-200/60">
                      <span className="text-gray-400 block mb-0.5">ملاحظات العميل:</span>
                      <p className="text-gray-700 italic bg-white p-2 rounded-lg border border-gray-100">
                        "{order.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Products list */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 text-xs">
                  <span className="font-bold text-gray-500 block mb-2">الأدوية المطلوبة:</span>
                  <div className="space-y-1.5">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-gray-800 py-1 border-b border-gray-50 last:border-none"
                      >
                        <span className="font-semibold">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-bold text-[#0755b8]">
                          {item.price ? `${(item.price * item.quantity).toFixed(2)} ج.م` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between font-black text-sm text-[#0755b8]">
                    <span>إجمالي الطلب:</span>
                    <span>{order.total.toFixed(2)} ج.م</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
