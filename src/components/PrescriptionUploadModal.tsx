import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Layers,
  Phone,
  MessageCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Medicine, PrescriptionExtractedMedicine, CustomerProfile, AuthSession } from '../types';
import {
  analyzePrescriptionImage,
  matchPrescriptionWithInventory,
  recordMissingMedicineRequest
} from '../services/api';

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Medicine[];
  onAddToCart: (medicine: Medicine, unitKey: string, unitLabel: string, price: number, stock: number) => void;
  onSelectAlternativeFor?: (medicineName: string) => void;
  session?: AuthSession | null;
  profile?: CustomerProfile | null;
}

export const PrescriptionUploadModal: React.FC<PrescriptionUploadModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onAddToCart,
  onSelectAlternativeFor,
  session,
  profile
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedMedicines, setExtractedMedicines] = useState<PrescriptionExtractedMedicine[] | null>(null);
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('');
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>('');
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});
  const [requestedMissing, setRequestedMissing] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى اختيار ملف صورة صالح (JPG أو PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setExtractedMedicines(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await analyzePrescriptionImage(selectedImage);
      if (!result.success || !result.medicines || result.medicines.length === 0) {
        throw new Error(result.error || 'لم يتم العثور على أدوية مقروءة في الصورة. يرجى التأكد من وضوح الروشتة والإضاءة.');
      }

      setDoctorSpecialty(result.doctorSpecialty || '');
      setPrescriptionNotes(result.notes || '');

      // Match extracted names with pharmacy inventory
      const matched = matchPrescriptionWithInventory(result.medicines, inventory);
      setExtractedMedicines(matched);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'تعذر تحليل الروشتة. يرجى المحاولة بصورة أوضح أو التواصل مع الصيدلية مباشرة.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setExtractedMedicines(null);
    setErrorMessage(null);
    setDoctorSpecialty('');
    setPrescriptionNotes('');
    setAddedItems({});
  };

  const handleAddMedicineToCart = (item: PrescriptionExtractedMedicine, index: number) => {
    if (!item.matchedMedicine || !item.isAvailable) return;
    const med = item.matchedMedicine;

    // Pick box if available, otherwise strip
    let unitKey = 'box';
    let unitLabel = 'علبة';
    let price = med.boxPrice || med.price || 0;
    let stock = med.boxStock || med.qty1 || med.qty || 1;

    if (item.selectedUnit === 'strip' && med.stripStock && med.stripStock > 0) {
      unitKey = 'strip';
      unitLabel = 'شريط';
      price = med.stripPrice || med.price2 || (price / 2);
      stock = med.stripStock;
    }

    onAddToCart(med, unitKey, unitLabel, price, stock);
    setAddedItems((prev) => ({ ...prev, [index]: true }));
  };

  const handleAddAllAvailable = () => {
    if (!extractedMedicines) return;
    extractedMedicines.forEach((item, idx) => {
      if (item.isAvailable && item.matchedMedicine && !addedItems[idx]) {
        handleAddMedicineToCart(item, idx);
      }
    });
  };

  const handleRequestMissing = (medicineName: string, index: number) => {
    const custName = profile?.full_name || session?.user?.email || 'عميل الروشتة';
    const custPhone = profile?.phone || '';

    recordMissingMedicineRequest({
      customerName: custName,
      customerPhone: custPhone,
      medicineName,
      notes: `مطلوب من روشتة تم رفعها بالتحليل الذكي`,
      source: 'prescription'
    });

    setRequestedMissing((prev) => ({ ...prev, [index]: true }));
  };

  const availableCount = extractedMedicines?.filter((m) => m.isAvailable).length || 0;
  const unavailableCount = extractedMedicines ? extractedMedicines.length - availableCount : 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#071b2a]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#dce9f8] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 relative"
      >
        {/* Modal Header with Rock-Solid Blue Background & High-Contrast Close Button */}
        <div
          className="text-white p-4 sm:p-5 flex items-center justify-between relative shadow-md border-b border-blue-900/20"
          style={{
            backgroundColor: '#0755b8',
            backgroundImage: 'linear-gradient(135deg, #0755b8 0%, #1565c0 100%)',
            color: '#ffffff'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">فحص الروشتة بالذكاء الاصطناعي</h3>
                <span className="bg-[#f20c69] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>فوري وذكي</span>
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5 font-medium">
                ارفع صورة الروشتة وسنقوم بقراءة الأدوية وإظهار المتوفر منها بالصيدلية فوراً
              </p>
            </div>
          </div>

          {/* Prominent Visible Close Button with Icon and Text */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-rose-600 hover:border-rose-400 active:scale-95 text-white font-black text-xs border border-white/40 shadow-sm cursor-pointer transition-all shrink-0"
            aria-label="إغلاق النافذة"
            title="إغلاق النافذة (X)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
            <span className="font-bold text-xs">إغلاق</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Step 1: No Image Selected */}
          {!selectedImage && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#b8d4f7] hover:border-[#0755b8] bg-[#f8fbfe] hover:bg-[#f0f6ff] rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-3xl bg-blue-100/70 text-[#0755b8] group-hover:scale-110 flex items-center justify-center mb-3 transition-transform shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="font-black text-[#15345b] text-base sm:text-lg mb-1">
                  اضغط هنا لاختيار صورة الروشتة أو اسحبها هنا
                </h4>
                <p className="text-xs text-[#527299] max-w-sm mb-4">
                  يدعم الصور الملتقطة بالكاميرا أو المحفوظة على جهازك (JPG, PNG). تأكد من وضوح الصورة وخط الطبيب.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="bg-[#0755b8] hover:bg-[#06479b] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>اختيار من المعرض</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>التقاط بالكاميرا</span>
                  </button>
                </div>
              </div>

              {/* Hidden Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Instructions Tip */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
                <span className="text-lg">💡</span>
                <div>
                  <b className="block mb-0.5">نصائح للحصول على أدق نتيجة:</b>
                  <p className="text-amber-800">
                    التقط الصورة في إضاءة جيدة وتأكد أن جميع أسماء الأدوية والجرعات ظاهرة بوضوح دون اهتزاز.
                  </p>
                </div>
              </div>

              {/* Bottom Actions Bar with explicit Close button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-400">
                  صيدلية د. هبه الشواربي - فحص وقراءة الروشتات آلياً
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-rose-50 hover:text-rose-600 active:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 border border-gray-200"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>إلغاء وإغلاق</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Image Preview & Trigger Analysis */}
          {selectedImage && !extractedMedicines && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-72 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="الروشتة المختارة"
                  className="max-h-72 w-auto object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تغيير الصورة</span>
                </button>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <b>تعذر الفحص:</b>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-rose-50 hover:text-rose-600 active:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-3.5 rounded-2xl cursor-pointer transition-colors flex items-center gap-1.5 border border-gray-200"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>إلغاء</span>
                </button>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: '#0755b8',
                    backgroundImage: 'linear-gradient(135deg, #0755b8 0%, #f20c69 100%)'
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري فحص وقراءة الروشتة بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>ابدأ فحص الروشتة وإظهار الأدوية المتاحة</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Analysis Results with Available and Unavailable Medicines */}
          {extractedMedicines && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Doctor / Prescription Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-bold text-[#0755b8] flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>تم قراءة الروشتة بنجاح ({extractedMedicines.length} صنف مستخرج)</span>
                  </span>
                  {doctorSpecialty && (
                    <p className="text-xs text-gray-700 mt-1 font-semibold">
                      التخصص الطبي: <span className="text-[#0755b8]">{doctorSpecialty}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl">
                    ✓ متوفر بالصيدلية: {availableCount}
                  </span>
                  {unavailableCount > 0 && (
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-xl">
                      ✕ غير متوفر: {unavailableCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Add All Available Button */}
              {availableCount > 0 && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                  <div className="text-xs text-emerald-900">
                    <b>جاهز للطلب:</b> يمكنك إضافة جميع الأدوية المتوفرة بالسلة دفعة واحدة.
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAllAvailable}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>إضافة كل المتوفر للسلة 🛒</span>
                  </button>
                </div>
              )}

              {/* Medicines List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#15345b] flex items-center gap-1.5">
                  <span>الأدوية المستخرجة من الروشتة:</span>
                </h4>

                {extractedMedicines.map((item, idx) => {
                  const isAdded = addedItems[idx];
                  const isRequested = requestedMissing[idx];

                  return (
                    <div
                      key={idx}
                      className={`border rounded-2xl p-4 transition-all ${
                        item.isAvailable
                          ? 'bg-white border-emerald-200 shadow-2xs'
                          : 'bg-[#fffaf0] border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-sm sm:text-base text-[#15345b]">
                              {item.name}
                            </h5>
                            {item.nameAr && item.nameAr !== item.name && (
                              <span className="text-xs text-gray-500 font-medium">
                                ({item.nameAr})
                              </span>
                            )}

                            {/* Status Badge */}
                            {item.isAvailable ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>متوفر في صيدلية د. هبه</span>
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>غير متوفر حالياً</span>
                              </span>
                            )}
                          </div>

                          {/* Dosage & Frequency from Doctor */}
                          {(item.dosage || item.frequency) && (
                            <div className="text-xs text-gray-600 mt-1 flex items-center gap-3 flex-wrap">
                              {item.dosage && (
                                <span className="bg-gray-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                                  {item.dosage}
                                </span>
                              )}
                              {item.frequency && (
                                <span className="text-gray-500 font-medium">
                                  طريقة الاستخدام: {item.frequency}
                                </span>
                              )}
                            </div>
                          )}

                          {/* If matched with inventory: show price */}
                          {item.isAvailable && item.matchedMedicine && (
                            <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-2">
                              <span>السعر في الصيدلية:</span>
                              <span className="text-sm font-black text-[#0755b8]">
                                {item.matchedMedicine.boxPrice || item.matchedMedicine.price} ج.م
                              </span>
                              {item.matchedMedicine.stripPrice && (
                                <span className="text-[11px] text-gray-500 font-normal">
                                  (شريط: {item.matchedMedicine.stripPrice} ج.م)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons for this item */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {item.isAvailable && item.matchedMedicine ? (
                            <button
                              type="button"
                              onClick={() => handleAddMedicineToCart(item, idx)}
                              className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-[#0755b8] hover:bg-[#06479b] text-white shadow-xs'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{isAdded ? 'تمت الإضافة للسلة ✓' : 'أضف للسلة'}</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {onSelectAlternativeFor && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectAlternativeFor(item.name);
                                    onClose();
                                  }}
                                  className="text-[11px] font-bold bg-white hover:bg-gray-50 text-[#0755b8] border border-[#bcd5f5] px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                                  title="ابحث عن بديل له نفس المادة الفعالة"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                  <span>البدائل</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRequestMissing(item.name, idx)}
                                disabled={isRequested}
                                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                                  isRequested
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-[#f20c69] hover:bg-[#d8085b] text-white shadow-xs'
                                }`}
                              >
                                <span>{isRequested ? 'تم طلب توفيره ✓' : 'طلب توفيره 🔔'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Change Image Button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-[#0755b8] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>فحص روشتة أخرى</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  إغلاق ومتابعة التسوق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
