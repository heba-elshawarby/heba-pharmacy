import { Medicine } from '../types';

export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

export const STORE_CATEGORIES: CategoryDef[] = [
  {
    id: 'all',
    name: 'جميع الأدوية',
    icon: '🌟',
    description: 'كافة الأدوية والمستلزمات المتاحة في الصيدلية',
    accentColor: '#0755b8',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700'
  },
  {
    id: 'syrup',
    name: 'أدوية شراب',
    icon: '🥄',
    description: 'أدوية الشراب والمعلقات ونقط الفم للأطفال والكبار',
    accentColor: '#d97706',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700'
  },
  {
    id: 'antibiotic',
    name: 'مضادات حيوية',
    icon: '💊',
    description: 'مضادات حيوية لعلاج العدوى والالتهابات البكتيرية',
    accentColor: '#dc2626',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700'
  },
  {
    id: 'diabetes',
    name: 'أدوية السكر',
    icon: '🩸',
    description: 'أدوية تنظيم نسبة الجلوكوز ومستلزمات السكري',
    accentColor: '#7c3aed',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700'
  },
  {
    id: 'hypertension',
    name: 'أدوية الضغط والقلب',
    icon: '🫀',
    description: 'أدوية تنظيم ضغط الدم وصحة القلب والأوعية الدموية',
    accentColor: '#0284c7',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700'
  },
  {
    id: 'cosmetics',
    name: 'مستحضرات وتجميل',
    icon: '✨',
    description: 'منتجات العناية بالبشرة والشعر والترطيب والواقيات',
    accentColor: '#db2777',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-700'
  },
  {
    id: 'pain',
    name: 'مسكنات وحرارة',
    icon: '⚡',
    description: 'مسكنات الآلام والصداع وخافضات الحرارة والالتهاب',
    accentColor: '#ea580c',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700'
  },
  {
    id: 'digestive',
    name: 'المعدة والهضم',
    icon: '🍃',
    description: 'أدوية الحموضة والقولون والمطهرات المعوية والتقلصات',
    accentColor: '#059669',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700'
  },
  {
    id: 'vitamins',
    name: 'فيتامينات ومقويات',
    icon: '🛡️',
    description: 'مكملات غذائية وفيتامينات لدعم المناعة والنشاط',
    accentColor: '#ca8a04',
    badgeBg: 'bg-yellow-50',
    badgeText: 'text-yellow-800'
  },
  {
    id: 'otc',
    name: 'أدوية بدون وصفة (OTC)',
    icon: '🟢',
    description: 'أدوية آمنة يمكن صرفها مباشرة بدون تذكرة طبية',
    accentColor: '#16a34a',
    badgeBg: 'bg-green-50',
    badgeText: 'text-green-700'
  }
];

export function getMedicineCategory(m: Medicine): string {
  // 1. Check explicit category field if provided
  if (m.category) {
    const cat = m.category.toLowerCase();
    if (cat.includes('شراب') || cat.includes('syrup')) return 'syrup';
    if (cat.includes('مضاد') || cat.includes('antibiotic')) return 'antibiotic';
    if (cat.includes('سكر') || cat.includes('diabetes')) return 'diabetes';
    if (cat.includes('ضغط') || cat.includes('قلب') || cat.includes('hypertension')) return 'hypertension';
    if (cat.includes('تجميل') || cat.includes('بشرة') || cat.includes('شعر') || cat.includes('cosmetic')) return 'cosmetics';
    if (cat.includes('مسكن') || cat.includes('حرارة') || cat.includes('pain')) return 'pain';
    if (cat.includes('هضم') || cat.includes('معدة') || cat.includes('digestive')) return 'digestive';
    if (cat.includes('فيتامين') || cat.includes('مكمل') || cat.includes('vitamin')) return 'vitamins';
  }

  const text = `${m.name} ${m.nameAr || ''} ${m.nameEn || ''} ${m.active || ''} ${m.group || ''} ${m.dose || ''} ${m.details || ''}`.toLowerCase();

  // 1. Syrups & Liquids
  if (
    text.includes('شراب') ||
    text.includes('syrup') ||
    text.includes('معلق') ||
    text.includes('suspension') ||
    text.includes('نقط فم') ||
    text.includes('oral drops')
  ) {
    return 'syrup';
  }

  // 2. Antibiotics
  if (
    text.includes('مضاد حيوي') ||
    text.includes('مضادات حيوية') ||
    text.includes('antibiotic') ||
    text.includes('أوجمنتين') ||
    text.includes('augmentin') ||
    text.includes('هاي بيوتك') ||
    text.includes('hibiotic') ||
    text.includes('كلافولانات') ||
    text.includes('clavulanic') ||
    text.includes('زيثروماكس') ||
    text.includes('zithromax') ||
    text.includes('أزيثروميسين') ||
    text.includes('azithromycin') ||
    text.includes('كيبوريكس') ||
    text.includes('ceporex') ||
    text.includes('تاريفيد') ||
    text.includes('tarivid') ||
    text.includes('فلوكسامو') ||
    text.includes('floxamo') ||
    text.includes('سيبروفلوكساسين') ||
    text.includes('ciprofloxacin') ||
    text.includes('سيفوتاكس') ||
    text.includes('cefotax') ||
    text.includes('أموكسيسيلين') ||
    text.includes('amoxicillin')
  ) {
    return 'antibiotic';
  }

  // 3. Diabetes
  if (
    text.includes('سكر') ||
    text.includes('سكري') ||
    text.includes('diabetes') ||
    text.includes('جلوكوفاج') ||
    text.includes('glucophage') ||
    text.includes('ميتفورمين') ||
    text.includes('metformin') ||
    text.includes('أماريل') ||
    text.includes('amaryl') ||
    text.includes('جليمبيريد') ||
    text.includes('glimepiride') ||
    text.includes('جانوفيا') ||
    text.includes('januvia') ||
    text.includes('سيتاجليبتين') ||
    text.includes('sitagliptin') ||
    text.includes('جالفس') ||
    text.includes('galvus') ||
    text.includes('فيلداجليبتين') ||
    text.includes('vildagliptin') ||
    text.includes('دايمكرون') ||
    text.includes('diamicron') ||
    text.includes('فورسيجا') ||
    text.includes('forxiga') ||
    text.includes('إنسولين') ||
    text.includes('insulin')
  ) {
    return 'diabetes';
  }

  // 4. Blood pressure & Heart
  if (
    text.includes('ضغط') ||
    text.includes('الضغط') ||
    text.includes('قلب') ||
    text.includes('hypertension') ||
    text.includes('blood pressure') ||
    text.includes('كونكور') ||
    text.includes('concor') ||
    text.includes('بيسوبرولول') ||
    text.includes('bisoprolol') ||
    text.includes('نورفاسك') ||
    text.includes('norvasc') ||
    text.includes('أملوديبين') ||
    text.includes('amlodipine') ||
    text.includes('كابوتين') ||
    text.includes('capoten') ||
    text.includes('كابوتريل') ||
    text.includes('captopril') ||
    text.includes('إكسفورج') ||
    text.includes('exforge') ||
    text.includes('فالسارتان') ||
    text.includes('valsartan') ||
    text.includes('ناتريليكس') ||
    text.includes('natrilix') ||
    text.includes('إنديرال') ||
    text.includes('inderal')
  ) {
    return 'hypertension';
  }

  // 5. Cosmetics / Skin Care
  if (
    text.includes('غسول') ||
    text.includes('كريم ترطيب') ||
    text.includes('واقي شمس') ||
    text.includes('سيروم') ||
    text.includes('سيرافيه') ||
    text.includes('cerave') ||
    text.includes('لاروش') ||
    text.includes('بيبانثين') ||
    text.includes('bepanthen') ||
    text.includes('فازلين') ||
    text.includes('vaseline') ||
    text.includes('شامبو') ||
    text.includes('shampoo') ||
    text.includes('عناية بالبشرة') ||
    text.includes('عناية بالشعر')
  ) {
    return 'cosmetics';
  }

  // 6. Digestive & Stomach
  if (
    text.includes('هضم') ||
    text.includes('معدة') ||
    text.includes('حموضة') ||
    text.includes('إسهال') ||
    text.includes('digestive') ||
    text.includes('stomach') ||
    text.includes('antinal') ||
    text.includes('أنتينال') ||
    text.includes('نيفوروكسازيد') ||
    text.includes('nifuroxazide') ||
    text.includes('جاستروزول') ||
    text.includes('gastrozole') ||
    text.includes('أوميبرازول') ||
    text.includes('omeprazole') ||
    text.includes('كونترولوك') ||
    text.includes('controloc') ||
    text.includes('بانتوبرازول') ||
    text.includes('pantoprazole') ||
    text.includes('موتيليوم') ||
    text.includes('motilium') ||
    text.includes('مترونيدازول') ||
    text.includes('فلاجيل') ||
    text.includes('flagyl')
  ) {
    return 'digestive';
  }

  // 7. Vitamins & Supplements
  if (
    text.includes('فيتامين') ||
    text.includes('مكمل') ||
    text.includes('vitamin') ||
    text.includes('أوميجا') ||
    text.includes('omega') ||
    text.includes('زنك') ||
    text.includes('zinc') ||
    text.includes('كالسيوم') ||
    text.includes('calcium') ||
    text.includes('حديد') ||
    text.includes('iron') ||
    text.includes('دافاليندي') ||
    text.includes('d3')
  ) {
    return 'vitamins';
  }

  // 8. Pain & Fever
  if (
    text.includes('مسكن') ||
    text.includes('حرارة') ||
    text.includes('صداع') ||
    text.includes('بانادول') ||
    text.includes('panadol') ||
    text.includes('باراسيتامول') ||
    text.includes('paracetamol') ||
    text.includes('بروفين') ||
    text.includes('brufen') ||
    text.includes('إيبوبروفين') ||
    text.includes('ibuprofen') ||
    text.includes('كيتوفان') ||
    text.includes('ketofan') ||
    text.includes('كتافلام') ||
    text.includes('cataflam') ||
    text.includes('سيتال') ||
    text.includes('cetal')
  ) {
    return 'pain';
  }

  return 'other';
}

export function getCategoryBadgeInfo(categoryId: string): { label: string; icon: string; className: string } {
  switch (categoryId) {
    case 'syrup':
      return { label: 'شراب وسوائل', icon: '🥄', className: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'antibiotic':
      return { label: 'مضاد حيوي', icon: '💊', className: 'bg-rose-50 text-rose-800 border-rose-200' };
    case 'diabetes':
      return { label: 'أدوية سكر', icon: '🩸', className: 'bg-purple-50 text-purple-800 border-purple-200' };
    case 'hypertension':
      return { label: 'ضغط وقلب', icon: '🫀', className: 'bg-sky-50 text-sky-800 border-sky-200' };
    case 'cosmetics':
      return { label: 'مستحضرات وتجميل', icon: '✨', className: 'bg-pink-50 text-pink-800 border-pink-200' };
    case 'pain':
      return { label: 'مسكن وحرارة', icon: '⚡', className: 'bg-orange-50 text-orange-800 border-orange-200' };
    case 'digestive':
      return { label: 'معدة وهضم', icon: '🍃', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'vitamins':
      return { label: 'فيتامينات ومناعة', icon: '🛡️', className: 'bg-yellow-50 text-yellow-900 border-yellow-200' };
    case 'otc':
      return { label: 'بدون وصفة OTC', icon: '🟢', className: 'bg-green-50 text-green-800 border-green-200' };
    default:
      return { label: 'دواء متوفر', icon: '✓', className: 'bg-blue-50 text-blue-800 border-blue-200' };
  }
}
