import React, { useState } from 'react';
import { Medicine } from '../types';
import { norm, compact, getUnitOptions, stockDescription } from '../services/api';
import { Layers, Search, CheckCircle2, AlertCircle, ArrowLeftRight, Sparkles, X } from 'lucide-react';
import { MedicineThumbnail } from '../utils/medicineImage';
import { VoiceSearchButton } from './VoiceSearchButton';

interface DrugAlternativesProps {
  medicines: Medicine[];
  onAddToCart: (medicine: Medicine, unitKey: string, unitLabel: string, price: number, stock: number) => void;
}

export const DrugAlternatives: React.FC<DrugAlternativesProps> = ({ medicines, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  // Filter medicines for autocomplete / suggestions
  const matchingMeds = searchTerm.trim()
    ? medicines.filter((m) => {
        const query = norm(searchTerm);
        const nameAr = norm(m.nameAr || m.name);
        const nameEn = norm(m.nameEn || '');
        const active = norm(m.active || '');
        return (
          nameAr.includes(query) ||
          nameEn.includes(query) ||
          active.includes(query) ||
          compact(nameAr).includes(compact(query)) ||
          compact(nameEn).includes(compact(query))
        );
      })
    : [];

  // When a medicine is chosen, find equivalents (same active ingredient)
  const currentActiveNorm = selectedMed ? norm(selectedMed.active) : '';
  const equivalents = selectedMed
    ? medicines.filter(
        (m) =>
          m.id !== selectedMed.id &&
          (norm(m.active) === currentActiveNorm ||
            (currentActiveNorm.length > 5 && norm(m.active).includes(currentActiveNorm)) ||
            (norm(m.active).length > 5 && currentActiveNorm.includes(norm(m.active))))
      )
    : [];

  // Quick suggestions for popular medicines
  const popularShortcuts = ['بانادول', 'أوجمنتين', 'كونكور', 'بروفين', 'أنتينال', 'كيتوفان'];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-[#e0ebf8] rounded-3xl p-5 sm:p-8 shadow-[0_8px_24px_rgba(7,85,184,0.06)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0755b8] to-[#0866cf] text-white flex items-center justify-center shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0755b8]">
              دليل الأدوية والبدائل المماثلة بالصور
            </h2>
            <p className="text-xs sm:text-sm text-[#47658a]">
              ابحث عن أي دواء لعرض صورته وتفاصيله وبدائله المتاحة في الصيدلية بنفس المادة الفعالة.
            </p>
          </div>
        </div>

        <div className="mt-4 relative">
          <div className="flex items-center gap-2 bg-[#f4f7fc] border border-[#dce6f4] rounded-2xl p-2.5 focus-within:border-[#0755b8] focus-within:bg-white transition-all shadow-2xs">
            <Search className="w-5 h-5 text-gray-400 mr-1 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value) setSelectedMed(null);
              }}
              placeholder="اكتب اسم الدواء أو تحدث بالصوت عبر الميكروفون 🎙️..."
              className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-[#15345b] placeholder:text-gray-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedMed(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <VoiceSearchButton
              onTranscript={(transcript) => {
                setSearchTerm(transcript);
                // Auto match if possible
                const found = medicines.find((m) =>
                  norm(m.name).includes(norm(transcript)) || norm(m.active).includes(norm(transcript))
                );
                if (found) {
                  setSelectedMed(found);
                }
              }}
              size="md"
            />
          </div>

          {/* Autocomplete Suggestions with Image Thumbnails */}
          {searchTerm.trim() && !selectedMed && matchingMeds.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl mt-1.5 max-h-72 overflow-y-auto divide-y divide-gray-100">
              {matchingMeds.slice(0, 10).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMed(m);
                    setSearchTerm(m.name);
                  }}
                  className="w-full text-right p-3 hover:bg-[#f5f9ff] flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                      <MedicineThumbnail medicine={m} className="w-full h-full" showBadge={false} />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-sm text-[#15345b] truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.active}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0755b8] bg-[#eaf4ff] px-2.5 py-1 rounded-lg flex-shrink-0">
                    {m.price.toFixed(2)} ج.م
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        {!selectedMed && (
          <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>أمثلة سريعة:</span>
            </span>
            {popularShortcuts.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => {
                  setSearchTerm(query);
                  const found = medicines.find((m) =>
                    norm(m.name).includes(norm(query)) || norm(m.active).includes(norm(query))
                  );
                  if (found) setSelectedMed(found);
                }}
                className="text-xs bg-[#f0f6ff] hover:bg-[#e0efff] text-[#0755b8] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-[#d6e7fc]"
              >
                {query}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Medicine Info Card with Visual Thumbnail */}
      {selectedMed && (
        <div className="bg-white border-2 border-[#dbeaff] rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#eaf4ff] text-[#0755b8] text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                الدواء المطلوب الأصلي
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedMed(null);
                  setSearchTerm('');
                }}
                className="text-xs text-gray-500 hover:text-rose-600 underline cursor-pointer"
              >
                بحث عن دواء آخر
              </button>
            </div>
            <span className="text-xs text-gray-500">
              المادة الفعالة: <b className="text-[#0755b8]">{selectedMed.active}</b>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Medicine Image */}
            <div className="w-full sm:w-44 h-40 flex-shrink-0">
              <MedicineThumbnail
                medicine={selectedMed}
                className="w-full h-full rounded-2xl shadow-xs"
              />
            </div>

            {/* Medicine Details & Purchase */}
            <div className="flex-1 flex flex-col justify-between w-full h-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-[#174477]">{selectedMed.name}</h3>
                  {selectedMed.nameEn && (
                    <p className="text-xs text-gray-500 mt-0.5">{selectedMed.nameEn}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-2 flex-wrap">
                    {selectedMed.manufacturer && (
                      <span className="bg-gray-100 px-2.5 py-0.5 rounded-md font-medium">
                        الشركة: {selectedMed.manufacturer}
                      </span>
                    )}
                    {selectedMed.conc && (
                      <span className="bg-gray-100 px-2.5 py-0.5 rounded-md font-medium">
                        التركيز: {selectedMed.conc}
                      </span>
                    )}
                    {selectedMed.dose && (
                      <span className="bg-gray-100 px-2.5 py-0.5 rounded-md font-medium">
                        الشكل: {selectedMed.dose}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1">
                  <span className="text-2xl font-black text-[#0755b8]">
                    {selectedMed.price.toFixed(2)} ج.م
                  </span>
                  <span
                    className={`text-xs font-bold flex items-center gap-1 ${
                      selectedMed.qty > 0 ? 'text-[#16845d]' : 'text-[#b42318]'
                    }`}
                  >
                    {selectedMed.qty > 0 ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {stockDescription(selectedMed)}
                  </span>
                </div>
              </div>

              {/* Add to Cart Unit Options */}
              {getUnitOptions(selectedMed).length > 0 && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">
                  {getUnitOptions(selectedMed).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        onAddToCart(selectedMed, opt.key, opt.label, opt.price, opt.stock)
                      }
                      className="bg-[#0755b8] hover:bg-[#06479b] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      أضف {opt.label} ({opt.price.toFixed(2)} ج.م)
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equivalents Section with Complete Images */}
      {selectedMed && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-[#15345b] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#f20c69]" />
              <span>البدائل والمثائل المتطابقة المتاحة ({equivalents.length})</span>
            </h3>
            <span className="text-xs text-gray-500">
              أدوية بنفس المادة الفعالة مع التكافؤ العلاجي الكامل
            </span>
          </div>

          {equivalents.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-500">
              لا توجد بدائل مسجلة حالياً بنفس المادة الفعالة لهذا الدواء في المخزون.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equivalents.map((alt) => {
                const altOpts = getUnitOptions(alt);
                const hasAltStock = altOpts.length > 0;
                return (
                  <div
                    key={alt.id}
                    className="bg-white border border-[#e0ebf8] hover:border-[#0755b8]/50 hover:shadow-md transition-all rounded-2xl p-4 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Product Image & Badges */}
                      <div className="relative mb-3">
                        <MedicineThumbnail
                          medicine={alt}
                          className="w-full h-36 rounded-xl"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                          <span className="bg-emerald-600/95 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            <span>نفس المادة الفعالة</span>
                          </span>
                        </div>
                        <div className="absolute top-2 left-2 z-10">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs flex items-center gap-1 ${
                              hasAltStock ? 'bg-white/95 text-emerald-700' : 'bg-white/95 text-rose-700'
                            }`}
                          >
                            {hasAltStock ? 'متوفر' : 'غير متوفر'}
                          </span>
                        </div>
                      </div>

                      {/* Medicine Title */}
                      <h4 className="font-bold text-base text-[#174477] group-hover:text-[#0755b8] transition-colors line-clamp-1">
                        {alt.name}
                      </h4>
                      {alt.nameEn && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alt.nameEn}</p>
                      )}

                      {/* Active Ingredient */}
                      <div className="bg-[#f0f6ff] text-[#0755b8] text-xs p-2 rounded-xl mt-2 font-medium flex items-center gap-1.5">
                        <span className="font-bold text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">المادة</span>
                        <span className="truncate">{alt.active}</span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 flex-wrap">
                        {alt.manufacturer && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {alt.manufacturer}
                          </span>
                        )}
                        {alt.conc && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {alt.conc}
                          </span>
                        )}
                        {alt.dose && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {alt.dose}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing & Add to Cart */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-sm sm:text-base text-[#0755b8]">
                        {alt.price.toFixed(2)} ج.م
                      </span>

                      {altOpts.length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {altOpts.map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() =>
                                onAddToCart(alt, opt.key, opt.label, opt.price, opt.stock)
                              }
                              className="bg-[#0755b8] hover:bg-[#06479b] text-white px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                            >
                              أضف {opt.label} ({opt.price.toFixed(2)} ج.م)
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">غير متوفر بالمخزون</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
