import React from 'react';
import { Order } from '../types';
import { Package, RotateCw, Calendar, Clock, MapPin } from 'lucide-react';

interface MyOrdersProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
}

const statusArabicMap: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'جديد', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  processing: { label: 'قيد التجهيز', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  shipped: { label: 'تم الشحن', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  completed: { label: 'مكتمل', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'ملغي', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
};

export const MyOrders: React.FC<MyOrdersProps> = ({ orders, loading, onRefresh }) => {
  return (
    <div className="bg-white border border-[#e0ebf8] rounded-2xl p-4 sm:p-5 shadow-[0_8px_24px_rgba(7,85,184,0.05)] my-4">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 flex-wrap gap-2">
        <div>
          <h3 className="font-extrabold text-base text-[#15345b] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0755b8]" />
            <span>📦 طلباتي المسجلة</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">يتم عرض الطلبات المرتبطة بك ومتابعة حالتها فورياً.</p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 bg-[#f0f6ff] hover:bg-[#e1eeff] text-[#0755b8] border border-[#dbeaff] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-sm text-gray-500">جاري تحميل طلباتك...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-xs font-medium">لا توجد طلبات مسجلة حتى الآن.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
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
                className="p-3.5 rounded-xl border border-gray-100 bg-[#fbfdff] hover:border-[#dbeaff] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <span className="font-black text-sm text-[#0755b8]">طلب #{order.id}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${st.bg} ${st.color}`}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Items */}
                <div className="text-xs text-gray-700 mb-2 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-500 block mb-1">الأدوية المطلوبة:</span>
                  {order.items?.map((item, idx) => (
                    <span key={idx} className="inline-block bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md text-[11px] font-bold text-gray-800 ml-1.5 mb-1">
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>

                {/* Address & Date */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 flex-wrap gap-2 pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </span>
                  <span className="font-black text-xs text-[#0755b8]">
                    الإجمالي: {order.total.toFixed(2)} ج.م
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
