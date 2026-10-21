import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MedicineCard } from './components/MedicineCard';
import { CartDrawer } from './components/CartDrawer';
import { AuthGate } from './components/AuthGate';
import { MyOrders } from './components/MyOrders';
import { AdminDashboard } from './components/AdminDashboard';
import { LinksModal } from './components/LinksModal';
import { PrescriptionUploadModal } from './components/PrescriptionUploadModal';
import { RequestMissingMedicineModal } from './components/RequestMissingMedicineModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { Medicine, CartItem, Order, AuthSession, CustomerProfile } from './types';
import {
  fetchInventory,
  matchesMedicineQuery,
  isAvailable,
  norm,
  getSavedSession,
  saveSession,
  fetchCustomerProfile,
  fetchOrders,
  subscribeToOrders,
  submitOrder,
  subscribeToInventoryUpdates,
  recordRegisteredCustomer
} from './services/api';
import { CART_STORAGE_KEY } from './constants/api';
import { ShoppingBag, Pill, RefreshCw, ShieldCheck, Lock, X, Camera, Bell } from 'lucide-react';

const checkUrlMode = (): 'customer' | 'admin' => {
  if (typeof window === 'undefined') return 'customer';
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (hash.includes('admin') || path.includes('admin') || search.includes('admin')) {
    return 'admin';
  }
  return 'customer';
};

export const App: React.FC = () => {
  // View mode: 'customer' (storefront) OR 'admin' (pharmacy management & incoming orders)
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>(checkUrlMode);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [linksInitialTab, setLinksInitialTab] = useState<'links' | 'howToShare' | 'pwaInstall'>('links');
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isRequestMissingModalOpen, setIsRequestMissingModalOpen] = useState(false);
  const [missingMedicinePrefill, setMissingMedicinePrefill] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Sync with browser URL navigation
  useEffect(() => {
    const handleLocationChange = () => {
      setViewMode(checkUrlMode());
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateToMode = (mode: 'customer' | 'admin') => {
    setViewMode(mode);
    try {
      if (mode === 'admin') {
        window.history.replaceState(null, '', '#admin');
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {}
  };

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [statusMessage, setStatusMessage] = useState('جاري تحميل مخزون الصيدلية...');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'available' | 'otc'>('all');

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auth & Session
  const [session, setSession] = useState<AuthSession | null>(() => getSavedSession());
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const ordersSectionRef = useRef<HTMLDivElement>(null);

  // Save cart to local storage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Load Inventory
  const loadMeds = async () => {
    setLoadingMeds(true);
    setStatusMessage('جاري تحميل مخزون الصيدلية...');
    try {
      const res = await fetchInventory();
      setMedicines(res.medicines);
      setStatusMessage(`تم تحميل ${res.medicines.length} صنف من مخزون الصيدلية.`);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setStatusMessage('تم تحميل المخزون المحلي.');
    } finally {
      setLoadingMeds(false);
    }
  };

  useEffect(() => {
    loadMeds();
    const unsubscribe = subscribeToInventoryUpdates((updated) => {
      if (Array.isArray(updated) && updated.length > 0) {
        setMedicines(updated);
        setStatusMessage(`تم تحديث المخزون لحظياً (${updated.length} صنف) ⚡`);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load Customer Profile and Orders
  const loadUserOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await fetchOrders(session?.user?.id, session?.access_token);
      setOrders(data);
    } catch (err) {
      console.warn('Orders load error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadUserOrders();
    const unsubOrders = subscribeToOrders((liveOrders) => {
      setOrders(liveOrders);
    });
    return () => unsubOrders();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchCustomerProfile(session.user.id, session.access_token).then((p) => {
        if (p) setProfile(p);
      });
      loadUserOrders();
    } else {
      setProfile(null);
      loadUserOrders();
    }
  }, [session]);

  const handleLogout = () => {
    setSession(null);
    setProfile(null);
    saveSession(null);
  };

  // Add to cart handler
  const handleAddToCart = (
    med: Medicine,
    unitKey: string,
    unitLabel: string,
    price: number,
    stock: number
  ) => {
    const cartItemId = `${med.id}_${unitKey}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        if (existing.qty >= stock) {
          alert('عفواً، لا توجد كمية إضافية متاحة من هذه الوحدة بالمخزون.');
          return prev;
        }
        return prev.map((i) => (i.id === cartItemId ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          id: cartItemId,
          medicineId: med.id,
          name: med.name,
          price,
          qty: 1,
          unitKey,
          unitLabel,
          maxStock: stock,
          raw: med
        }
      ];
    });
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: Math.min(newQty, item.maxStock) } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSubmitOrder = async (formData: {
    name: string;
    phone: string;
    address: string;
    notes: string;
  }) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const orderItems = cart.map((x) => ({
      name: `${x.name} (${x.unitLabel})`,
      quantity: x.qty,
      price: x.price,
      medicine_id: x.medicineId
    }));

    await submitOrder(
      {
        customer_name: formData.name,
        customer_phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        items: orderItems,
        total,
        user_id: session?.user?.id
      },
      session?.access_token
    );

    recordRegisteredCustomer({
      fullName: formData.name,
      phone: formData.phone,
      address: formData.address,
      email: session?.user?.email || '',
      registeredAt: new Date().toISOString()
    });

    await loadUserOrders();
  };

  // Filtered medicines in store: ONLY available medicines are shown!
  const filteredMeds = useMemo(() => {
    return medicines.filter((m) => {
      // Exclude any unavailable / out-of-stock medicine
      if (!isAvailable(m)) return false;
      if (filterType === 'otc' && !norm(m.otc).includes('otc')) return false;
      return matchesMedicineQuery(m, searchQuery);
    });
  }, [medicines, filterType, searchQuery]);

  const totalAvailableCount = useMemo(() => {
    return medicines.filter((m) => isAvailable(m)).length;
  }, [medicines]);

  const cartTotalCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const handleAdminAuthCheck = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234 or direct submit
    if (pinInput === '1234' || pinInput === '' || pinInput.toLowerCase() === 'admin') {
      navigateToMode('admin');
      setShowAdminPinModal(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('رمز الدخول غير صحيح. الرمز الافتراضي هو 1234');
    }
  };

  const scrollToOrders = () => {
    ordersSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // If viewMode is 'admin', render the full dedicated Pharmacist & Inventory Dashboard
  if (viewMode === 'admin') {
    return (
      <>
        <PWAInstallBanner />
        <AdminDashboard
          medicines={medicines}
          orders={orders}
          onUpdateMedicines={setMedicines}
          onUpdateOrders={setOrders}
          onRefreshOrders={loadUserOrders}
          onExitAdmin={() => navigateToMode('customer')}
          onOpenLinks={(tab) => {
            setLinksInitialTab(tab || 'links');
            setShowLinksModal(true);
          }}
          onAddToCart={handleAddToCart}
        />
        <LinksModal
          isOpen={showLinksModal}
          initialTab={linksInitialTab}
          onClose={() => setShowLinksModal(false)}
          onGoToAdmin={() => {
            setShowLinksModal(false);
            navigateToMode('admin');
          }}
          onGoToCustomer={() => {
            setShowLinksModal(false);
            navigateToMode('customer');
          }}
        />
      </>
    );
  }

  // Pure Customer Storefront View
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f9ff] text-[#15345b]">
      <PWAInstallBanner />
      {/* Header */}
      <Header
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        session={session}
        profile={profile}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => setShowAdminPinModal(true)}
        onOpenLinks={() => setShowLinksModal(true)}
        onScrollToOrders={scrollToOrders}
        onOpenPrescription={() => setIsPrescriptionModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6">
        {/* Welcome Card when logged in */}
        {session && profile && (
          <div className="bg-white border-r-4 border-r-[#f20c69] border border-[#dbeaff] rounded-2xl p-4 mb-4 flex items-center justify-between shadow-2xs">
            <div>
              <p className="font-bold text-sm text-[#0755b8]">أهلاً بك، {profile.full_name} 👋</p>
              <p className="text-xs text-gray-500 mt-0.5">رقم العميل: <b>{profile.customer_number}</b></p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-[#f20c69] hover:bg-[#d8085b] text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>
        )}

        {/* Hero banner with search and prescription/missing medicine triggers */}
        <Hero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={() => {}}
          onOpenPrescription={() => setIsPrescriptionModalOpen(true)}
          onOpenRequestMissing={() => {
            setMissingMedicinePrefill(searchQuery || '');
            setIsRequestMissingModalOpen(true);
          }}
        />

        {/* Filter Chips - Only In-Stock Medicines */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar my-4 py-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-[#0755b8] text-white shadow-2xs'
                : 'bg-white border border-[#dbe8f8] text-[#0755b8] hover:bg-[#f0f6ff]'
            }`}
          >
            جميع الأدوية المتوفرة ({totalAvailableCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('otc')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'otc'
                ? 'bg-[#0755b8] text-white shadow-2xs'
                : 'bg-white border border-[#dbe8f8] text-[#0755b8] hover:bg-[#f0f6ff]'
            }`}
          >
            أدوية OTC متوفرة (بدون وصفة)
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-[#eaf4ff] border border-[#dbeaff] rounded-xl px-4 py-2.5 text-xs text-[#0755b8] font-bold flex items-center justify-between mb-5">
          <span className="flex items-center gap-1.5">
            <span>✓</span>
            <span>يتم عرض الأدوية المتوفرة حالياً بالصيدلية فقط ({filteredMeds.length} صنف متاح للطلب الفوري)</span>
          </span>
          <button
            type="button"
            onClick={loadMeds}
            className="flex items-center gap-1 hover:underline cursor-pointer flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMeds ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>

        {/* Medicines Catalog Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {filteredMeds.length === 0 ? (
            <div
              className="col-span-full border-2 border-dashed border-rose-300 rounded-3xl p-8 sm:p-10 text-center shadow-sm"
              style={{
                backgroundColor: '#fff7fa',
                backgroundImage: 'linear-gradient(135deg, #fff1f5 0%, #ffffff 50%, #eff6ff 100%)'
              }}
            >
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-[#f20c69] flex items-center justify-center mx-auto mb-3 text-2xl font-bold shadow-xs">
                🔍
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#102a43] mb-1">
                {searchQuery.trim()
                  ? `دواء "${searchQuery}" غير متوفر حالياً في الصيدلية`
                  : 'لم نجد أدوية مطابقة للبحث'}
              </h3>
              <p className="text-xs sm:text-sm text-[#47658a] max-w-md mx-auto mb-5 leading-relaxed">
                لا تقلق! سنقوم بإبلاغ إدارة صيدلية د. هبه الشواربي فوراً لطلب هذا الدواء وتأمينه لك في أسرع وقت والتواصل معك هاتفياً أو عبر واتساب فور توفره.
              </p>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setMissingMedicinePrefill(searchQuery || '');
                    setIsRequestMissingModalOpen(true);
                  }}
                  className="bg-[#f20c69] hover:bg-[#d8085b] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Bell className="w-4 h-4" />
                  <span>
                    {searchQuery.trim()
                      ? `اطلب توفير دواء "${searchQuery}" فوراً 🔔`
                      : 'طلب توفير دواء غير متوفر 🔔'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrescriptionModalOpen(true)}
                  className="bg-[#0755b8] hover:bg-[#06479b] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>فحص روشتة الطبيب 📸</span>
                </button>
              </div>
            </div>
          ) : (
            filteredMeds.map((med) => (
              <MedicineCard
                key={med.id}
                medicine={med}
                onAddToCart={handleAddToCart}
              />
            ))
          )}
        </section>

        {/* Customer Orders Box */}
        <div ref={ordersSectionRef}>
          <MyOrders
            orders={orders}
            loading={loadingOrders}
            onRefresh={loadUserOrders}
          />
        </div>
      </main>

      {/* Sticky Bottom Bar for Cart */}
      {cart.length > 0 && (
        <div className="sticky bottom-4 z-40 max-w-xl mx-auto w-[92%] bg-[#0755b8] text-white p-3.5 rounded-2xl shadow-[0_10px_28px_rgba(7,85,184,0.4)] flex items-center justify-between border border-blue-400/30 animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">🛒 سلة الطلب:</span>
            <span className="bg-[#f20c69] text-white text-xs font-black px-2 py-0.5 rounded-full min-w-[24px] text-center">
              {cartTotalCount}
            </span>
            <span className="text-xs opacity-90 mr-1">
              (
              {cart
                .reduce((sum, item) => sum + item.price * item.qty, 0)
                .toFixed(2)}{' '}
              ج.م)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="bg-[#f20c69] hover:bg-[#d8085b] text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            عرض ومتابعة الطلب
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        session={session}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Auth Gate Modal */}
      <AuthGate
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(sess) => {
          setSession(sess);
        }}
      />

      {/* Admin Entry Modal */}
      {showAdminPinModal && (
        <div
          onClick={() => {
            setShowAdminPinModal(false);
            setPinError('');
            setPinInput('');
          }}
          className="fixed inset-0 z-50 bg-[#071b2a]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-[#dce9f8] animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => {
                setShowAdminPinModal(false);
                setPinError('');
                setPinInput('');
              }}
              className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 flex items-center justify-center cursor-pointer transition-colors border border-gray-200 shadow-2xs"
              title="إغلاق (X)"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#0755b8] text-white mx-auto flex items-center justify-center text-2xl mb-3 shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[#102a43]">دخول إدارة الصيدلية</h3>
              <p className="text-xs text-gray-500 mt-1">
                مخصص لصيادلة وإدارة الصيدلية لمتابعة الطلبات وتعديل المخزون
              </p>
            </div>

            <form onSubmit={handleAdminAuthCheck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رمز مرور الإدارة (PIN)
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="الرمز الافتراضي: 1234"
                    className="w-full text-sm outline-none bg-transparent"
                    autoFocus
                  />
                </div>
                {pinError && <p className="text-xs text-rose-600 mt-1.5">{pinError}</p>}
                <p className="text-[11px] text-gray-400 mt-1">اضغط دخول مباشرة أو اكتب 1234</p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0755b8] hover:bg-[#06479b] text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-sm cursor-pointer"
              >
                دخول لوحة التحكم
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Quick Prescription Button (Always visible) */}
      <button
        type="button"
        onClick={() => setIsPrescriptionModalOpen(true)}
        className="fixed bottom-6 left-4 z-30 text-white font-black text-xs sm:text-sm px-4.5 py-3 rounded-full shadow-[0_8px_24px_rgba(5,150,105,0.45)] flex items-center gap-2 border-2 border-white/90 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        style={{
          backgroundColor: '#047857',
          backgroundImage: 'linear-gradient(135deg, #065f46 0%, #059669 45%, #0284c7 100%)',
          color: '#ffffff'
        }}
        title="اضغط هنا لتصوير أو رفع روشتة الطبيب"
      >
        <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        <span className="whitespace-nowrap font-black">ارفع روشتة</span>
      </button>

      {/* Customer Footer */}
      <footer className="bg-[#0755b8] text-white mt-12 py-8 px-4 border-t border-blue-600/30">
        <div className="max-w-7xl mx-auto flex justify-around gap-6 flex-wrap text-center text-xs sm:text-sm">
          <div>
            <div className="font-bold">♡ صيدلية د. هبه الشواربي</div>
            <div className="opacity-80 text-xs mt-1">صحتك وسلامتك أولويتنا دائماً</div>
          </div>
          <div>
            <div className="font-bold">✓ رعاية دوائية موثوقة</div>
            <div className="opacity-80 text-xs mt-1">أدوية ومستحضرات أصلية ومفحوصة</div>
          </div>
          <div>
            <div className="font-bold">⌕ توصيل سريع ومتابعة</div>
            <div className="opacity-80 text-xs mt-1">استلام الطلب والتوصيل للباب</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowLinksModal(true)}
              className="opacity-80 hover:opacity-100 flex items-center gap-1 transition-opacity cursor-pointer text-xs underline"
            >
              <span>🔗 روابط المتجر والإدارة</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAdminPinModal(true)}
              className="opacity-70 hover:opacity-100 flex items-center gap-1 transition-opacity cursor-pointer text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>لوحة الإدارة والصيدلي</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Links Modal */}
      <LinksModal
        isOpen={showLinksModal}
        initialTab={linksInitialTab}
        onClose={() => setShowLinksModal(false)}
        onGoToAdmin={() => {
          setShowLinksModal(false);
          navigateToMode('admin');
        }}
        onGoToCustomer={() => {
          setShowLinksModal(false);
          navigateToMode('customer');
        }}
      />

      {/* Prescription Upload & AI Vision Scanner Modal */}
      <PrescriptionUploadModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        inventory={medicines}
        onAddToCart={handleAddToCart}
        session={session}
        profile={profile}
      />

      {/* Request Missing Medicine Modal */}
      <RequestMissingMedicineModal
        isOpen={isRequestMissingModalOpen}
        onClose={() => setIsRequestMissingModalOpen(false)}
        initialMedicineName={missingMedicinePrefill}
        session={session}
        profile={profile}
      />
    </div>
  );
};

export default App;
