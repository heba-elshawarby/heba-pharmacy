import React, { useState } from 'react';
import { CosmeticItem } from '../types';
import { loadCosmetics, saveCosmetics, norm } from '../services/api';
import { Sparkles, Search, Plus, CheckCircle2 } from 'lucide-react';

export const CosmeticsManager: React.FC = () => {
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>(() => loadCosmetics());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showAddForm, setShowAddForm] = useState(false);

  // New cosmetic state
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('عناية بالبشرة');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newStock, setNewStock] = useState<number>(5);
  const [newDesc, setNewDesc] = useState('');

  const categories = ['الكل', 'عناية بالبشرة', 'واقيات الشمس', 'عناية بالشعر', 'ترطيب وحماية'];

  const filtered = cosmetics.filter((item) => {
    if (selectedCategory !== 'الكل' && item.category !== selectedCategory) return false;
    if (!searchTerm.trim()) return true;

    const query = norm(searchTerm);
    return (
      norm(item.name).includes(query) ||
      norm(item.brand).includes(query) ||
      norm(item.description || '').includes(query)
    );
  });

  const handleAddCosmetic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newBrand.trim()) return;

    const newItem: CosmeticItem = {
      id: 'cos-' + Date.now(),
      name: newName.trim(),
      brand: newBrand.trim(),
      category: newCategory,
      price: typeof newPrice === 'number' ? newPrice : 0,
      stock: newStock || 0,
      description: newDesc.trim()
    };

    const updated = [newItem, ...cosmetics];
    setCosmetics(updated);
    saveCosmetics(updated);

    setNewName('');
    setNewBrand('');
    setNewPrice('');
    setNewDesc('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(7,85,184,0.06)]">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f20c69] to-[#d83b82] text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0755b8]">
                🧴 قسم المستحضرات والعناية والتجميل
              </h2>
              <p className="text-xs sm:text-sm text-[#47658a]">
                دليل مستحضرات العناية بالبشرة والشعر ومستحضرات التجميل الطبية.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-[#f20c69] hover:bg-[#d8085b] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مستحضر جديد</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 flex items-center gap-2 bg-[#f4f7fc] border border-gray-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المستحضر أو الشركة..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm"
          />
        </div>

        {/* Categories Chips */}
        <div className="flex gap-2 flex-wrap mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#f20c69] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe8f8] text-[#0755b8] hover:bg-[#f5f9ff]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Cosmetic Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddCosmetic}
          className="bg-white border-2 border-pink-200 rounded-3xl p-6 shadow-md animate-in slide-in-from-top-4"
        >
          <h3 className="font-black text-lg text-[#f20c69] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>إضافة مستحضر تجميلي أو عناية جديد</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم المستحضر *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="اسم المنتج"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#f20c69]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الشركة / الماركة *</label>
              <input
                type="text"
                required
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Brand (مثل La Roche, CeraVe)"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#f20c69]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">القسم</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#f20c69] bg-white"
              >
                <option>عناية بالبشرة</option>
                <option>واقيات الشمس</option>
                <option>عناية بالشعر</option>
                <option>ترطيب وحماية</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">السعر (ج.م)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#f20c69]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الكمية بالمخزون</label>
              <input
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#f20c69]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">وصف المنتج وطريقة الاستخدام</label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="تفاصيل المستحضر، نوع البشرة المناسبة، الاستخدامات..."
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#f20c69] resize-none"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              className="bg-[#f20c69] hover:bg-[#d8085b] text-white px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-sm"
            >
              حفظ المستحضر
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Cosmetics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 font-medium">
            لا توجد مستحضرات مطابقة للبحث.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#e0ebf8] hover:border-[#f20c69]/40 rounded-2xl p-4 shadow-[0_8px_20px_rgba(7,85,184,0.05)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-[#fff0f6] text-[#d83b82] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#f3d5e2]">
                    {item.category}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    متاح ({item.stock})
                  </span>
                </div>

                <h4 className="font-bold text-sm text-[#174477] line-clamp-2">{item.name}</h4>
                <p className="text-xs font-bold text-[#0755b8] mt-1">{item.brand}</p>

                {item.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-base font-black text-[#f20c69]">
                  {item.price.toFixed(2)} ج.م
                </span>
                <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                  مخزون الصيدلية
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
