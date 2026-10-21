import React, { useState } from 'react';
import { Medicine } from '../types';
import {
  norm,
  compact,
  saveLocalInventory,
  recordDeletedMedicineId,
  recordDeletedMedicineIds,
  clearDeletedMedicineIds,
  createMedicineRemote,
  updateMedicineRemote,
  deleteMedicineRemote
} from '../services/api';
import { INITIAL_MEDICINES } from '../constants/sampleData';
import {
  Package,
  Barcode,
  Search,
  Plus,
  Save,
  Trash2,
  Share2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye
} from 'lucide-react';

interface InventoryManagerProps {
  medicines: Medicine[];
  onUpdateMedicines: (updated: Medicine[]) => void;
  onPreviewCustomerStore?: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  medicines,
  onUpdateMedicines,
  onPreviewCustomerStore
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outstock'>('all');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(2);
  const [showAddBox, setShowAddBox] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Editable rows state (keyed by medicine id)
  const [editedRows, setEditedRows] = useState<Record<string, Partial<Medicine>>>({});

  // New product form fields
  const [newCode, setNewCode] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newActive, setNewActive] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newStripPrice, setNewStripPrice] = useState<number | ''>('');
  const [newQty1, setNewQty1] = useState<number>(5);
  const [newUnit1, setNewUnit1] = useState('علبة');
  const [newQty2, setNewQty2] = useState<number>(0);
  const [newUnit2, setNewUnit2] = useState('شريط');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Filtered medicines
  const filteredMeds = medicines.filter((m) => {
    // Stock filter
    const totalQty = (m.qty1 || 0) + (m.qty2 || 0) || m.qty || 0;
    if (stockFilter === 'instock' && totalQty <= 0) return false;
    if (stockFilter === 'outstock' && totalQty > 0) return false;

    // Search query
    const query = norm(searchTerm || barcodeInput);
    if (!query) return true;

    const hay = [
      m.name,
      m.nameAr,
      m.nameEn,
      m.active,
      m.code,
      m.barcode,
      m.manufacturer
    ]
      .filter(Boolean)
      .map(norm)
      .join(' ');

    return hay.includes(query) || compact(hay).includes(compact(query));
  });

  const totalItemsCount = medicines.length;
  const inStockCount = medicines.filter((m) => ((m.qty1 || 0) + (m.qty2 || 0) || m.qty || 0) > 0).length;

  // Shortages (items <= threshold)
  const shortages = medicines.filter(
    (m) => ((m.qty1 || 0) + (m.qty2 || 0) || m.qty || 0) <= lowStockThreshold
  );

  const handleCellChange = (id: string | number, field: keyof Medicine, value: any) => {
    const key = String(id);
    setEditedRows((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveRow = (med: Medicine) => {
    const key = String(med.id);
    const changes = editedRows[key];
    if (!changes) return;

    let savedMed: Medicine | null = null;
    const updated = medicines.map((item) => {
      if (String(item.id) === key) {
        const merged = { ...item, ...changes };
        merged.qty = (merged.qty1 || 0) + (merged.qty2 || 0);
        savedMed = merged;
        return merged;
      }
      return item;
    });

    onUpdateMedicines(updated);
    saveLocalInventory(updated);

    // Sync to remote database so customers see it immediately
    if (savedMed) {
      updateMedicineRemote(savedMed);
    }

    // clear from editedRows
    setEditedRows((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    setStatusMessage(`تم حفظ وتحديث الصنف "${med.name}" في قاعدة بيانات الصيدلية والمخزون ✅`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const handleDeleteRow = (med: Medicine) => {
    if (!window.confirm(`هل أنت متأكد من حذف الصنف "${med.name}" من المخزون؟`)) return;

    const updated = medicines.filter((m) => String(m.id) !== String(med.id));
    onUpdateMedicines(updated);
    saveLocalInventory(updated);
    recordDeletedMedicineId(med.id);
    deleteMedicineRemote(med.id);
    setStatusMessage(`تم حذف الصنف "${med.name}" من المخزون بنجاح 🗑️`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameAr.trim()) {
      alert('يرجى كتابة اسم المنتج العربي');
      return;
    }

    const p = typeof newPrice === 'number' ? newPrice : 0;
    const pStrip = typeof newStripPrice === 'number' && newStripPrice > 0 ? newStripPrice : (p > 0 ? Number((p / 2).toFixed(2)) : 0);
    // Guarantee that stock is greater than 0 so the medicine is considered available in the customer storefront!
    const initialQty1 = typeof newQty1 === 'number' && newQty1 > 0 ? newQty1 : (newQty2 > 0 ? 0 : 5);
    const initialQty2 = typeof newQty2 === 'number' && newQty2 > 0 ? newQty2 : initialQty1 * 2;
    const totalQty = initialQty1 + initialQty2;

    const newMed: Medicine = {
      id: 'med-' + Date.now(),
      name: newNameAr.trim(),
      nameAr: newNameAr.trim(),
      nameEn: newNameEn.trim(),
      active: newActive.trim(),
      price: p,
      price1: p,
      price2: pStrip,
      boxPrice: p,
      boxStock: initialQty1,
      stripPrice: pStrip,
      stripStock: initialQty2,
      qty: totalQty,
      qty1: initialQty1,
      qty2: initialQty2,
      unit1: newUnit1 || 'علبة',
      unit2: newUnit2 || 'شريط',
      manufacturer: newCompany.trim(),
      code: newCode.trim(),
      barcode: newBarcode.trim(),
      img: newImageUrl.trim() || undefined
    };

    const updated = [newMed, ...medicines];
    onUpdateMedicines(updated);
    saveLocalInventory(updated);
    // Push directly to online database so all customers see it immediately!
    createMedicineRemote(newMed);

    // Reset form with default 5 units for next item
    setNewCode('');
    setNewBarcode('');
    setNewNameAr('');
    setNewNameEn('');
    setNewActive('');
    setNewCompany('');
    setNewPrice('');
    setNewStripPrice('');
    setNewQty1(5);
    setNewQty2(0);
    setNewImageUrl('');
    setShowAddBox(false);

    setStatusMessage(`تمت إضافة الدواء الجديد "${newMed.name}" بنجاح! أصبح متوفراً الآن فوراً في واجهة العملاء للطلب ✅`);
    setTimeout(() => setStatusMessage(''), 4500);
  };

  const outOfStockItems = medicines.filter(
    (m) => ((m.qty1 || 0) + (m.qty2 || 0) || m.qty || 0) <= 0
  );

  const handleDeleteAllOutOfStock = () => {
    if (outOfStockItems.length === 0) {
      alert('لا توجد أصناف منتهية أو غير متوفرة في المخزون حالياً.');
      return;
    }
    if (
      window.confirm(
        `هل تريد بالتأكيد حذف ${outOfStockItems.length} صنف غير متوفر نهائياً من المخزون؟`
      )
    ) {
      const remaining = medicines.filter(
        (m) => ((m.qty1 || 0) + (m.qty2 || 0) || m.qty || 0) > 0
      );
      onUpdateMedicines(remaining);
      saveLocalInventory(remaining);
      const deletedIds = outOfStockItems.map((item) => item.id);
      recordDeletedMedicineIds(deletedIds);
      outOfStockItems.forEach((item) => deleteMedicineRemote(item.id));
      setStatusMessage(`تم حذف ${outOfStockItems.length} صنف غير متوفر من المخزون بنجاح 🗑️`);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('هل تريد استعادة بيانات مخزون الصيدلية الافتراضية؟')) {
      clearDeletedMedicineIds();
      onUpdateMedicines(INITIAL_MEDICINES);
      saveLocalInventory(INITIAL_MEDICINES);
      setStatusMessage('تمت استعادة مخزون الصيدلية الافتراضي.');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleSendWhatsAppShortages = () => {
    if (shortages.length === 0) {
      alert('لا توجد أصناف ناقصة أو أقل من حد التنبيه حالياً!');
      return;
    }

    let text = `*قائمة نواقص صيدلية د. هبه الشواربي*\n`;
    text += `التاريخ: ${new Date().toLocaleDateString('ar-EG')}\n`;
    text += `حد التنبيه: ${lowStockThreshold} أو أقل\n\n`;

    shortages.forEach((m, idx) => {
      const q1 = m.qty1 || 0;
      const u1 = m.unit1 || 'علبة';
      const q2 = m.qty2 || 0;
      const u2 = m.unit2 || 'شريط';
      text += `${idx + 1}. *${m.name}* (المتبقي: ${q1} ${u1}${q2 > 0 ? ` + ${q2} ${u2}` : ''})\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(7,85,184,0.06)]">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0755b8] text-white flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0755b8]">
                📦 إدارة مخزون الصيدلية
              </h2>
              <p className="text-xs sm:text-sm text-[#47658a]">
                تعديل مباشر على الأسعار والكميات والوحدات مع تنبيه النواقص ودعم قارئ الباركود.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddBox(!showAddBox)}
              className="flex items-center gap-1.5 bg-[#1f9d72] hover:bg-[#187d5b] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
            {outOfStockItems.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllOutOfStock}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="حذف جميع الأصناف غير المتوفرة (الكمية 0)"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>حذف غير المتوفر ({outOfStockItems.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="استعادة البيانات الأصلية"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">إرجاع الأصل</span>
            </button>
            {onPreviewCustomerStore && (
              <button
                type="button"
                onClick={onPreviewCustomerStore}
                className="flex items-center gap-1.5 bg-[#0755b8]/10 hover:bg-[#0755b8]/20 text-[#0755b8] border border-[#0755b8]/20 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                title="معاينة ظهور الأدوية في واجهة العملاء"
              >
                <Eye className="w-4 h-4" />
                <span>معاينة واجهة العميل</span>
              </button>
            )}
          </div>
        </div>

        {/* Barcode Scanner row */}
        <div className="mt-4 p-3.5 bg-[#f6fafe] border border-[#dcecff] rounded-2xl flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-2xs">
            <Barcode className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="📷 امسح أو اكتب الباركود الدولي هنا..."
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm"
              dir="ltr"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            يدعم أجهزة الباركود USB والمسح السريع تلقائياً.
          </span>
        </div>

        {/* Search & Stock Filter Toolbar */}
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-[#f4f7fc] border border-gray-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، المادة الفعالة، الكود، الشركة..."
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                stockFilter === 'all' ? 'bg-white text-[#0755b8] shadow-2xs' : 'text-gray-600'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('instock')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                stockFilter === 'instock' ? 'bg-white text-[#16845d] shadow-2xs' : 'text-gray-600'
              }`}
            >
              ✅ المتوفر فقط
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('outstock')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                stockFilter === 'outstock' ? 'bg-white text-[#b42318] shadow-2xs' : 'text-gray-600'
              }`}
            >
              ❌ المنتهي فقط
            </button>
          </div>
        </div>

        {/* Stats & Shortage WhatsApp Button */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap font-bold text-gray-600">
            <span className="bg-[#f0f6ff] text-[#0755b8] px-3 py-1.5 rounded-full">
              إجمالي الأصناف: {totalItemsCount}
            </span>
            <span className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full">
              المتوفر: {inStockCount}
            </span>
            <span className="bg-rose-50 text-rose-800 px-3 py-1.5 rounded-full">
              المعروض حالياً: {filteredMeds.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-600 font-bold flex items-center gap-1 text-xs">
              <span>حد النواقص:</span>
              <input
                type="number"
                min={0}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value) || 0)}
                className="w-14 border border-gray-200 rounded-lg p-1 text-center font-bold"
              />
            </label>
            <button
              type="button"
              onClick={handleSendWhatsAppShortages}
              className="flex items-center gap-1.5 bg-[#168c4a] hover:bg-[#12723c] text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>📱 إرسال النواقص على WhatsApp ({shortages.length})</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-in fade-in">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Add New Product Form */}
      {showAddBox && (
        <form
          onSubmit={handleAddNewProduct}
          className="bg-white border-2 border-[#1f9d72]/30 rounded-3xl p-6 shadow-md animate-in slide-in-from-top-4"
        >
          <h3 className="font-black text-lg text-[#1f9d72] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>إضافة منتج جديد لمخزون الصيدلية</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الكود التعريفي</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="مثال: 1055"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الباركود الدولي</label>
              <input
                type="text"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                placeholder="الباركود"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم الصنف العربي *</label>
              <input
                type="text"
                required
                value={newNameAr}
                onChange={(e) => setNewNameAr(e.target.value)}
                placeholder="اسم الدواء"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الاسم بالإنجليزي</label>
              <input
                type="text"
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                placeholder="English Name"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">المادة الفعالة</label>
              <input
                type="text"
                value={newActive}
                onChange={(e) => setNewActive(e.target.value)}
                placeholder="Active Ingredient"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الشركة المصنعة</label>
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Company"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">سعر العلبة (ج.م)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={newPrice}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setNewPrice(val);
                  if (typeof val === 'number' && val > 0 && newStripPrice === '') {
                    setNewStripPrice(Number((val / 2).toFixed(2)));
                  }
                }}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                سعر الشريط (ج.م) <span className="text-[10px] text-gray-400 font-normal">(نصف العلبة افتراضياً)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={newStripPrice}
                onChange={(e) => setNewStripPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={typeof newPrice === 'number' && newPrice > 0 ? (newPrice / 2).toFixed(2) : "0.00"}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">كمية العلب (وحدة 1)</label>
                <input
                  type="number"
                  min={0}
                  value={newQty1}
                  onChange={(e) => setNewQty1(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الوحدة 1</label>
                <select
                  value={newUnit1}
                  onChange={(e) => setNewUnit1(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72] bg-white"
                >
                  <option>علبة</option>
                  <option>شريط</option>
                  <option>زجاجة</option>
                  <option>أمبول</option>
                  <option>أنبوبة</option>
                  <option>كيس</option>
                  <option>قرص</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  كمية الأشرطة المنفصلة <span className="text-[10px] text-gray-400 font-normal">(اختياري)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={newQty2}
                  onChange={(e) => setNewQty2(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الوحدة 2</label>
                <select
                  value={newUnit2}
                  onChange={(e) => setNewUnit2(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72] bg-white"
                >
                  <option>شريط</option>
                  <option>قرص</option>
                  <option>كيس</option>
                  <option>أمبول</option>
                  <option>علبة</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">رابط صورة الدواء (اختياري)</label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/medicine.jpg"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#1f9d72]"
                dir="ltr"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-2 text-xs text-[#0755b8]">
            <CheckCircle2 className="w-4 h-4 text-[#1f9d72] shrink-0" />
            <span>
              <b>تأكيد التزامن التلقائي:</b> بمجرد الضغط على زر الحفظ، سيتم نشر هذا الصنف فوراً في واجهة المتجر ليتمكن جميع العملاء من طلبه مباشرة!
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              className="bg-[#1f9d72] hover:bg-[#187d5b] text-white px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <span>💾 حفظ ونشر الدواء فوراً للعملاء</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddBox(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Interactive Inventory Table */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[950px] text-xs">
            <thead>
              <tr className="bg-[#102a43] text-white text-[11px] font-bold">
                <th className="p-3 w-20">الكود</th>
                <th className="p-3 w-28">الباركود</th>
                <th className="p-3 min-w-[180px]">اسم الصنف العربي</th>
                <th className="p-3 min-w-[150px]">الاسم English</th>
                <th className="p-3 min-w-[140px]">المادة الفعالة</th>
                <th className="p-3 w-24">سعر العلبة</th>
                <th className="p-3 w-24">سعر الشريط</th>
                <th className="p-3 w-20">كمية 1</th>
                <th className="p-3 w-24">وحدة 1</th>
                <th className="p-3 w-20">كمية 2</th>
                <th className="p-3 w-24">وحدة 2</th>
                <th className="p-3 w-20">الحالة</th>
                <th className="p-3 w-28 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMeds.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-gray-400 font-medium">
                    لم نجد أي صنف مطابق للبحث في المخزون.
                  </td>
                </tr>
              ) : (
                filteredMeds.map((med) => {
                  const key = String(med.id);
                  const rowDraft = editedRows[key] || {};
                  const isModified = Object.keys(rowDraft).length > 0;

                  const code = rowDraft.code !== undefined ? rowDraft.code : med.code || '';
                  const barcode =
                    rowDraft.barcode !== undefined ? rowDraft.barcode : med.barcode || '';
                  const name = rowDraft.name !== undefined ? rowDraft.name : med.name || '';
                  const nameEn = rowDraft.nameEn !== undefined ? rowDraft.nameEn : med.nameEn || '';
                  const active = rowDraft.active !== undefined ? rowDraft.active : med.active || '';
                  const price = rowDraft.price !== undefined ? rowDraft.price : med.price || 0;
                  const price2 = rowDraft.price2 !== undefined ? rowDraft.price2 : (med.price2 || med.stripPrice || (price > 0 ? Number((price / 2).toFixed(2)) : 0));
                  const qty1 = rowDraft.qty1 !== undefined ? rowDraft.qty1 : med.qty1 || 0;
                  const unit1 = rowDraft.unit1 !== undefined ? rowDraft.unit1 : med.unit1 || 'علبة';
                  const qty2 = rowDraft.qty2 !== undefined ? rowDraft.qty2 : med.qty2 || 0;
                  const unit2 = rowDraft.unit2 !== undefined ? rowDraft.unit2 : med.unit2 || 'شريط';

                  const totalStock = (qty1 || 0) + (qty2 || 0);

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-[#fbfdff] transition-colors ${
                        isModified ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => handleCellChange(med.id, 'code', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-center"
                        />
                      </td>

                      {/* Barcode */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={barcode}
                          onChange={(e) => handleCellChange(med.id, 'barcode', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-center"
                          dir="ltr"
                        />
                      </td>

                      {/* Arabic Name */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleCellChange(med.id, 'name', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white font-bold text-[#174477]"
                        />
                      </td>

                      {/* English Name */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={nameEn}
                          onChange={(e) => handleCellChange(med.id, 'nameEn', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-gray-600"
                        />
                      </td>

                      {/* Active Ingredient */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={active}
                          onChange={(e) => handleCellChange(med.id, 'active', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-gray-700"
                        />
                      </td>

                      {/* Box Price */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={price}
                            onChange={(e) =>
                              handleCellChange(med.id, 'price', Number(e.target.value))
                            }
                            className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-center font-bold text-[#0755b8]"
                            title="سعر العلبة"
                          />
                        </div>
                      </td>

                      {/* Strip Price */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={price2}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              handleCellChange(med.id, 'price2', val);
                              handleCellChange(med.id, 'stripPrice', val);
                            }}
                            className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-center font-bold text-[#0f766e]"
                            title="سعر الشريط"
                          />
                        </div>
                      </td>

                      {/* Qty 1 */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={0}
                          value={qty1}
                          onChange={(e) => handleCellChange(med.id, 'qty1', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-center font-bold"
                        />
                      </td>

                      {/* Unit 1 */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={unit1}
                          onChange={(e) => handleCellChange(med.id, 'unit1', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-center"
                        />
                      </td>

                      {/* Qty 2 */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={0}
                          value={qty2}
                          onChange={(e) => handleCellChange(med.id, 'qty2', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-center font-bold"
                        />
                      </td>

                      {/* Unit 2 */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={unit2}
                          onChange={(e) => handleCellChange(med.id, 'unit2', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white text-center"
                        />
                      </td>

                      {/* Status */}
                      <td className="p-2.5 text-center">
                        {totalStock <= 0 ? (
                          <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            منتهي
                          </span>
                        ) : totalStock <= lowStockThreshold ? (
                          <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            ناقص ({totalStock})
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            متوفر
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(med)}
                            disabled={!isModified}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isModified
                                ? 'bg-[#0755b8] hover:bg-[#06479b] text-white shadow-sm'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title="حفظ التعديلات"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(med)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
