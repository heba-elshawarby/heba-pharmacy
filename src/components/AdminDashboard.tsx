import React, { useState, useEffect } from 'react';
import { Medicine, Order } from '../types';
import { InventoryManager } from './InventoryManager';
import { AdminOrdersManager } from './AdminOrdersManager';
import { DrugAlternatives } from './DrugAlternatives';
import { CosmeticsManager } from './CosmeticsManager';
import { PharmacySettingsTab } from './PharmacySettingsTab';
import { CustomersManager } from './CustomersManager';
import { MissingMedicinesManager } from './MissingMedicinesManager';
import { getPharmacyLogo, fetchLocalCustomers, fetchRemoteCustomers, fetchMissingMedicineRequests } from '../services/api';
import { DEFAULT_PHARMACY_LOGO } from '../constants/logo';
import {
  ClipboardList,
  Package,
  Layers,
  Sparkles,
  BarChart3,
  Users,
  LogOut,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Settings,
  Download
} from 'lucide-react';

interface AdminDashboardProps {
  medicines: Medicine[];
  orders: Order[];
  onUpdateMedicines: (updated: Medicine[]) => void;
  onUpdateOrders: (updated: Order[]) => void;
  onRefreshOrders: () => void;
  onExitAdmin: () => void;
  onOpenLinks: (tab?: 'links' | 'howToShare' | 'pwaInstall') => void;
  onAddToCart?: (medicine: Medicine, unitKey: string, unitLabel: string, price: number, stock: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  medicines,
  orders,
  onUpdateMedicines,
  onUpdateOrders,
  onRefreshOrders,
  onExitAdmin,
  onOpenLinks,
  onAddToCart
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'missingMedicines' | 'inventory' | 'stats' | 'alternatives' | 'cosmetics' | 'settings'>('orders');
  const [logoUrl, setLogoUrl] = useState<string | null>(() => getPharmacyLogo());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [customersCount, setCustomersCount] = useState<number>(() => fetchLocalCustomers(orders).length);
  const [newCustomerAlert, setNewCustomerAlert] = useState<{ name: string; phone: string } | null>(null);
  const [missingRequestsCount, setMissingRequestsCount] = useState<number>(
    () => fetchMissingMedicineRequests().filter((r) => r.status === 'pending').length
  );
  const [missingMedAlert, setMissingMedAlert] = useState<{ med: string; name: string; phone: string } | null>(null);

  useEffect(() => {
    const updateCustomers = (e?: any) => {
      const list = fetchLocalCustomers(orders);
      setCustomersCount(list.length);
      if (e?.detail?.fullName) {
        setNewCustomerAlert({ name: e.detail.fullName, phone: e.detail.phone || '' });
        setTimeout(() => setNewCustomerAlert(null), 8000);
      }
    };
    updateCustomers();
    fetchRemoteCustomers().then(() => {
      updateCustomers();
    });
    window.addEventListener('new_customer_registered', updateCustomers);
    window.addEventListener('storage', updateCustomers);
    return () => {
      window.removeEventListener('new_customer_registered', updateCustomers);
      window.removeEventListener('storage', updateCustomers);
    };
  }, [orders]);

  useEffect(() => {
    const updateMissing = (e?: any) => {
      const list = fetchMissingMedicineRequests();
      setMissingRequestsCount(list.filter((r) => r.status === 'pending').length);
      if (e?.detail?.medicineName) {
        setMissingMedAlert({
          med: e.detail.medicineName,
          name: e.detail.customerName || 'عميل',
          phone: e.detail.customerPhone || ''
        });
        setTimeout(() => setMissingMedAlert(null), 10000);
      }
    };
    updateMissing();
    window.addEventListener('missing_medicine_requested', updateMissing);
    window.addEventListener('missing_medicine_updated', updateMissing);
    window.addEventListener('storage', updateMissing);
    return () => {
      window.removeEventListener('missing_medicine_requested', updateMissing);
      window.removeEventListener('missing_medicine_updated', updateMissing);
      window.removeEventListener('storage', updateMissing);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
          return;
        }
      } catch (e) {}
    }
    // Also trigger direct desktop shortcut download (.url)
    try {
      const adminUrl = `${window.location.origin}${window.location.pathname.replace(/\/admin\/?$/, '').replace(/\/$/, '') || ''}/#admin`;
      const shortcutContent = `[InternetShortcut]\r\nURL=${adminUrl}\r\nIconIndex=0\r\nIconFile=${window.location.origin}/favicon.ico\r\n`;
      const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'صيدلية د. هبه الشواربي - لوحة الإدارة.url';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {}

    // Open detailed guided instructions on pwaInstall tab
    onOpenLinks('pwaInstall');
  };

  useEffect(() => {
    const handleLogoUpdate = (e: any) => {
      setLogoUrl(e.detail !== undefined ? e.detail : getPharmacyLogo());
    };
    window.addEventListener('pharmacy_logo_updated', handleLogoUpdate);
    return () => window.removeEventListener('pharmacy_logo_updated', handleLogoUpdate);
  }, []);

  // Key KPI stats
  const pendingOrders = orders.filter((o) => o.status === 'new');
  const processingOrders = orders.filter((o) => o.status === 'processing');
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockCount = medicines.filter(
    (m) => ((m.qty1 || 0) + (m.qty2 || 0) || m.qty || 0) <= 2
  ).length;

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-[#15345b] flex flex-col">
      {/* Admin Top Navigation */}
      <header className="bg-[#102a43] text-white sticky top-0 z-40 border-b border-blue-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-white/20 text-[#0755b8] flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden flex-shrink-0 p-0.5">
              <img
                src={logoUrl || DEFAULT_PHARMACY_LOGO}
                alt="شعار الصيدلية"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black leading-tight">
                  لوحة تحكم إدارة صيدلية د. هبه الشواربي
                </h1>
                <span className="bg-[#f20c69] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  إدارة الصيدلية
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                متابعة الطلبات الواردة • المخزون والأسعار • النواقص والبدائل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick alert badge if there are new orders */}
            {pendingOrders.length > 0 && (
              <div className="bg-[#f20c69]/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Bell className="w-3.5 h-3.5" />
                <span>{pendingOrders.length} طلبات جديدة!</span>
              </div>
            )}

            {/* View Switcher Toggle */}
            <div className="flex items-center bg-black/25 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={onExitAdmin}
                className="px-2.5 py-1 rounded-lg font-bold text-white/90 hover:text-white hover:bg-white/20 transition-all flex items-center gap-1 cursor-pointer"
                title="الانتقال لمتجر العميل"
              >
                <span>🛒</span>
                <span>واجهة العميل</span>
              </button>
              <span className="px-2.5 py-1 rounded-lg font-bold bg-[#f20c69] text-white shadow-xs flex items-center gap-1">
                <span>⚙️</span>
                <span>لوحة الإدارة</span>
              </span>
            </div>

            {/* Install Desktop App Button */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer animate-pulse"
              title="تثبيت لوحة الإدارة كبرنامج على الكمبيوتر أو الموبايل"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت كبرنامج 💻</span>
            </button>

            {/* Links sharing modal trigger */}
            <button
              type="button"
              onClick={() => onOpenLinks('links')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="عرض روابط المتجر والإدارة"
            >
              <span>🔗 الروابط والمشاركة</span>
            </button>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="max-w-7xl mx-auto px-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#f20c69] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>طلبات العملاء الواردة</span>
            {pendingOrders.length > 0 && (
              <span className="bg-white text-[#f20c69] text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#f20c69] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>دليل وسجل العملاء</span>
            {customersCount > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {customersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missingMedicines')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'missingMedicines'
                ? 'bg-[#f20c69] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Bell className="w-4 h-4 text-pink-300" />
            <span>نواقص وطلبات الأدوية</span>
            {missingRequestsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center animate-pulse">
                {missingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#f20c69] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>إدارة المخزون والأسعار</span>
            {lowStockCount > 0 && (
              <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {lowStockCount} ناقص
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#f20c69] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>إحصائيات وتقارير</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alternatives')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'alternatives'
                ? 'bg-[#f20c69] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>دليل البدائل للصيدلي</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cosmetics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cosmetics'
                ? 'bg-[#f20c69] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>مستحضرات التجميل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#f20c69] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>شعار وإعدادات الصيدلية</span>
          </button>
        </div>
      </header>

      {/* Real-time New Customer Alert Banner */}
      {newCustomerAlert && (
        <div
          className="text-white px-4 py-2.5 shadow-md flex items-center justify-between border-b border-emerald-500 animate-in slide-in-from-top duration-300"
          style={{
            backgroundColor: '#059669',
            backgroundImage: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            color: '#ffffff'
          }}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <span className="text-lg">🎉</span>
              <span>عميل جديد سجل في التطبيق الآن:</span>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-emerald-100 font-black">
                {newCustomerAlert.name}
              </span>
              {newCustomerAlert.phone && (
                <span className="bg-emerald-900/40 px-2 py-0.5 rounded-lg text-xs font-mono" dir="ltr">
                  📞 {newCustomerAlert.phone}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('customers');
                  setNewCustomerAlert(null);
                }}
                className="bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
              >
                عرض سجل العملاء ←
              </button>
              <button
                type="button"
                onClick={() => setNewCustomerAlert(null)}
                className="text-white/80 hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Missing Medicine Alert Banner */}
      {missingMedAlert && (
        <div
          className="text-white px-4 py-2.5 shadow-md flex items-center justify-between border-b border-rose-500 animate-in slide-in-from-top duration-300"
          style={{
            backgroundColor: '#e11d48',
            backgroundImage: 'linear-gradient(135deg, #e11d48 0%, #db2777 100%)',
            color: '#ffffff'
          }}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <span className="text-lg">🔔</span>
              <span>عميل يبحث عن دواء غير متوفر:</span>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-white font-black">
                "{missingMedAlert.med}"
              </span>
              <span className="text-rose-100">
                العميل: {missingMedAlert.name} {missingMedAlert.phone && `(📞 ${missingMedAlert.phone})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('missingMedicines');
                  setMissingMedAlert(null);
                }}
                className="bg-white text-rose-800 hover:bg-rose-50 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
              >
                عرض طلبات التوفير ←
              </button>
              <button
                type="button"
                onClick={() => setMissingMedAlert(null)}
                className="text-white/80 hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Statistics & Overview Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-black text-[#0755b8] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#f20c69]" />
                <span>ملخص أداء الصيدلية والطلبات</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-blue-700 mb-1">
                    <span className="text-xs font-bold">الطلبات الجديدة المعلقة</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-black text-blue-900">{pendingOrders.length}</p>
                  <p className="text-[11px] text-blue-600 mt-1">بحاجة إلى تأكيد وتجهيز</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-amber-700 mb-1">
                    <span className="text-xs font-bold">قيد التجهيز / الشحن</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-black text-amber-900">{processingOrders.length}</p>
                  <p className="text-[11px] text-amber-600 mt-1">في طريقها للعميل</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-emerald-700 mb-1">
                    <span className="text-xs font-bold">إجمالي المبيعات النشطة</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-black text-emerald-900">{totalRevenue.toFixed(2)} ج.م</p>
                  <p className="text-[11px] text-emerald-600 mt-1">من طلبات التطبيق</p>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-rose-700 mb-1">
                    <span className="text-xs font-bold">أصناف قاربت على النفاد</span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-black text-rose-900">{lowStockCount}</p>
                  <p className="text-[11px] text-rose-600 mt-1">أقل من أو يساوي 2 وحدات</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-sm text-gray-700 mb-3">إجراءات سريعة للصيدلي:</h3>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="bg-[#0755b8] hover:bg-[#06479b] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  فتح قائمة الطلبات ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('customers')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>سجل ودليل العملاء ({customersCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('missingMedicines')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>نواقص الأدوية ({missingRequestsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="bg-[#f20c69] hover:bg-[#d8085b] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  فحص وتعديل المخزون ({medicines.length} صنف)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('alternatives')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  البحث في دليل البدائل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Management Tab */}
        {activeTab === 'orders' && (
          <AdminOrdersManager
            orders={orders}
            onUpdateOrders={onUpdateOrders}
            onRefresh={onRefreshOrders}
          />
        )}

        {/* Customers Management Tab */}
        {activeTab === 'customers' && (
          <CustomersManager orders={orders} />
        )}

        {/* Missing Medicines & Requests Tab */}
        {activeTab === 'missingMedicines' && (
          <MissingMedicinesManager
            onOpenInventoryForMedicine={() => {
              setActiveTab('inventory');
            }}
          />
        )}

        {/* Inventory Management Tab */}
        {activeTab === 'inventory' && (
          <InventoryManager
            medicines={medicines}
            onUpdateMedicines={onUpdateMedicines}
            onPreviewCustomerStore={onExitAdmin}
          />
        )}

        {/* Alternatives Tab */}
        {activeTab === 'alternatives' && (
          <DrugAlternatives
            medicines={medicines}
            onAddToCart={onAddToCart || (() => {})}
          />
        )}

        {/* Cosmetics Tab */}
        {activeTab === 'cosmetics' && (
          <CosmeticsManager />
        )}

        {/* Pharmacy Logo & Settings Tab */}
        {activeTab === 'settings' && (
          <PharmacySettingsTab />
        )}
      </main>
    </div>
  );
};
