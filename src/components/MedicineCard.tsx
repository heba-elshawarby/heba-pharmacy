import React, { useState } from 'react';
import { Medicine } from '../types';
import { getUnitOptions, stockDescription } from '../services/api';
import { CheckCircle2, AlertCircle, ShoppingBag, Check } from 'lucide-react';
import { MedicineThumbnail } from '../utils/medicineImage';
import { getMedicineCategory, getCategoryBadgeInfo } from '../utils/categories';

interface MedicineCardProps {
  medicine: Medicine;
  onAddToCart: (medicine: Medicine, unitKey: string, unitLabel: string, price: number, stock: number) => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onAddToCart }) => {
  const options = getUnitOptions(medicine);
  const extra = [medicine.conc, medicine.dose, medicine.manufacturer].filter(Boolean).join(' · ');
  const stockText = stockDescription(medicine);
  const hasStock = options.length > 0;
  const hasBothBoxAndStrip = options.some((o) => o.label === 'علبة') && options.some((o) => o.label === 'شريط');
  const categoryId = getMedicineCategory(medicine);
  const badgeInfo = getCategoryBadgeInfo(categoryId);

  const [addedUnitKey, setAddedUnitKey] = useState<string | null>(null);

  const handleAdd = (unitKey: string, label: string, price: number, stock: number) => {
    onAddToCart(medicine, unitKey, label, price, stock);
    setAddedUnitKey(unitKey);
    setTimeout(() => {
      setAddedUnitKey(null);
    }, 1500);
  };

  return (
    <article className="bg-white border border-[#e0ebf8] rounded-2xl p-3 sm:p-4 shadow-[0_8px_24px_rgba(7,85,184,0.05)] hover:shadow-[0_12px_28px_rgba(7,85,184,0.1)] transition-all flex flex-col justify-between relative group">
      <div>
        {/* Medicine Image */}
        <div className="relative mb-3">
          <MedicineThumbnail
            medicine={medicine}
            className="h-32 sm:h-36 w-full rounded-xl"
            showBadge={false}
          />

          {/* Category Badge */}
          <span
            className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs border backdrop-blur-xs z-10 flex items-center gap-1 ${badgeInfo.className}`}
          >
            <span>{badgeInfo.icon}</span>
            <span>{badgeInfo.label}</span>
          </span>

          {/* Tag: Available by Strip & Box */}
          {hasBothBoxAndStrip && (
            <span className="absolute top-2 right-2 bg-emerald-600/95 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs z-10">
              <span>💊</span>
              <span>بالشريط أو العلبة</span>
            </span>
          )}

          {medicine.otc && !hasBothBoxAndStrip && (
            <span className="absolute top-2 right-2 bg-pink-50/95 text-[#f20c69] border border-pink-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs z-10">
              {medicine.otc}
            </span>
          )}
        </div>

        {/* Medicine Titles */}
        <h3 className="font-bold text-sm sm:text-base text-[#174477] line-clamp-2 min-h-[2.5rem] leading-snug">
          {medicine.name}
        </h3>

        {medicine.nameEn && medicine.nameEn !== medicine.name && (
          <p className="text-xs text-[#687b8b] mt-0.5 line-clamp-1 font-sans">{medicine.nameEn}</p>
        )}

        {/* Active Ingredient */}
        {medicine.active && (
          <p className="text-xs text-[#47658a] bg-[#f2f7fd] rounded-lg px-2 py-1 mt-1.5 font-medium line-clamp-1">
            {medicine.active}
          </p>
        )}

        {/* Extra info (strength, form, manufacturer) */}
        {extra && <p className="text-[11px] text-[#687b8b] mt-1 line-clamp-1">{extra}</p>}

        {medicine.details && (
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {medicine.details}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[#edf4ff]">
        {/* Availability status line */}
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[11px] text-gray-500 font-medium">
            {hasBothBoxAndStrip ? 'طلب شريط أو علبة:' : 'السعر والتوفر:'}
          </span>
          <span
            className={`flex items-center gap-1 font-bold text-[11px] ${
              hasStock ? 'text-[#16845d]' : 'text-[#b42318]'
            }`}
          >
            {hasStock ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {stockText}
          </span>
        </div>

        {/* Unit Add Buttons with Clear Separation */}
        {options.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              {options.map((opt) => {
                const isStrip = opt.label === 'شريط';
                const isBox = opt.label === 'علبة';
                const isJustAdded = addedUnitKey === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleAdd(opt.key, opt.label, opt.price, opt.stock)}
                    className={`flex-1 p-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center shadow-2xs border ${
                      isJustAdded
                        ? 'bg-green-600 text-white border-green-600'
                        : isStrip
                        ? 'bg-[#0f766e] hover:bg-[#0d655f] text-white border-teal-700/20 hover:shadow-md'
                        : isBox
                        ? 'bg-[#0755b8] hover:bg-[#06479b] text-white border-blue-700/20 hover:shadow-md'
                        : 'bg-[#0755b8] hover:bg-[#06479b] text-white border-blue-700/20'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تمت الإضافة</span>
                        </>
                      ) : (
                        <>
                          <span>{isStrip ? '💊 شريط' : isBox ? '📦 علبة' : `+ ${opt.label}`}</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] opacity-95 font-black mt-0.5">
                      {opt.price.toFixed(2)} ج.م
                    </span>
                  </button>
                );
              })}
            </div>
            {hasBothBoxAndStrip && (
              <p className="text-[10px] text-center text-gray-400">
                يمكنك طلب شريط واحد أو علبة كاملة
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 text-gray-500 text-xs text-center py-2.5 rounded-xl font-bold">
            غير متوفر حالياً
          </div>
        )}
      </div>
    </article>
  );
};
