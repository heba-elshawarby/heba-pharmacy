import { Medicine } from '../types';
import { norm, compact } from '../services/api';

// Common Arabic stop words and colloquial prefixes used in pharmacy queries
const STOP_WORDS = new Set([
  'دوا', 'دواء', 'ادوية', 'أدوية',
  'علاج', 'علاجات',
  'حبوب', 'برشام', 'برشامة', 'اقراص', 'أقراص',
  'كبسول', 'كبسولات', 'كبسولة',
  'شراب', 'نقط', 'قطرة', 'قطرات',
  'مرهم', 'كريم', 'دهان',
  'فوار', 'حقن', 'حقنة', 'امبول',
  'عاوز', 'عايز', 'عايزة', 'عاوزة', 'محتاج', 'محتاجة',
  'اريد', 'أريد', 'ابغى', 'ابي',
  'في', 'من', 'على', 'عن', 'مع', 'حق', 'بتاع', 'بتاعة', 'بتاعت',
  'لو', 'سمحت', 'ممكن', 'افضل', 'أفضل', 'احسن', 'أحسن',
  'قوي', 'سريع', 'فعال', 'موجود', 'متوفر'
]);

// Strip common Arabic prefixes like 'للـ', 'لـ', 'بالـ', 'بـ', 'والـ', 'وـ'
export function cleanArabicWord(word: string): string {
  let w = norm(word).trim();
  if (!w) return '';

  // Remove leading conjunctions and prepositions
  if (w.startsWith('وال') && w.length > 4) w = w.slice(3);
  else if (w.startsWith('بال') && w.length > 4) w = w.slice(3);
  else if (w.startsWith('لل') && w.length > 3) w = w.slice(2);
  else if (w.startsWith('ال') && w.length > 3) w = w.slice(2);
  else if (w.startsWith('و') && w.length > 3) w = w.slice(1);
  else if (w.startsWith('ب') && w.length > 3) w = w.slice(1);
  else if (w.startsWith('ل') && w.length > 3) w = w.slice(1);

  return w;
}

export interface SymptomRule {
  id: string;
  label: string;
  // Trigger keywords from user input
  triggers: string[];
  // Terms that identify relevant medicines in their name, active ingredient, group, details, or dose
  medicineMatchTerms: string[];
}

export const SYMPTOM_RULES: SymptomRule[] = [
  {
    id: 'fever',
    label: 'خافض للحرارة',
    triggers: [
      'حراره', 'حرارة', 'سخونيه', 'سخونية', 'سخونه', 'سخونة', 'حمى', 'حمي',
      'خفض الحراره', 'خفض الحرارة', 'خافض حراره', 'خافض حرارة', 'تنزيل الحراره', 'تنزيل الحرارة',
      'ففر', 'fever', 'temperature'
    ],
    medicineMatchTerms: [
      'خافض للحرارة', 'باراسيتامول', 'paracetamol', 'بانادول', 'panadol',
      'سيتال', 'cetal', 'بروفين', 'brufen', 'ايبوبروفين', 'ibuprofen',
      'كيتوفان', 'ketofan', 'مسكن للآلام وخافض', 'مسكنات'
    ]
  },
  {
    id: 'headache',
    label: 'مسكن للصداع',
    triggers: [
      'صداع', 'شقيقه', 'شقيقة', 'وجع راس', 'الم راس', 'راسي', 'دماغي', 'headache', 'migraine'
    ],
    medicineMatchTerms: [
      'صداع', 'بانادول', 'panadol', 'سيتال', 'cetal', 'بروفين', 'brufen',
      'كيتوفان', 'ketofan', 'باراسيتامول', 'paracetamol', 'مسكن للآلام', 'مسكنات'
    ]
  },
  {
    id: 'children',
    label: 'للأطفال',
    triggers: [
      'اطفال', 'أطفال', 'طفل', 'طفله', 'طفلة', 'بيبي', 'رضيع', 'رضع', 'children', 'kids', 'baby', 'pediatric'
    ],
    medicineMatchTerms: [
      'شراب', 'نقط', 'سيرب', 'syrup', 'drops', 'suspension', 'اطفال', 'أطفال', 'سيتال'
    ]
  },
  {
    id: 'cold_flu',
    label: 'نزلات البرد والإنفلونزا',
    triggers: [
      'برد', 'انفلونزا', 'أنفلونزا', 'زكام', 'رشح', 'عطس', 'احتقان', 'انسداد الانف',
      'جيوب انفية', 'جيوب انفيه', 'انف', 'نشله', 'نشلة', 'كولد', 'فلو', 'cold', 'flu'
    ],
    medicineMatchTerms: [
      'برد', 'انفلونزا', 'كونجستال', 'congestal', 'رشح', 'احتقان',
      'كلورفينيرامين', 'بسودوايفيدرين', 'pseudoephedrine', 'فلو'
    ]
  },
  {
    id: 'stomach_digestive',
    label: 'المغص والجهاز الهضمي',
    triggers: [
      'مغص', 'مغص بطن', 'بطني', 'وجع بطن', 'قولون', 'تقلصات', 'غازات', 'انتفاخ',
      'عسر هضم', 'تشنجات'
    ],
    medicineMatchTerms: [
      'انتينال', 'antinal', 'مطهر معوي', 'تقلصات', 'قولون', 'اسهال',
      'هضم', 'جاستروزول', 'gastrozole', 'معده', 'معدة'
    ]
  },
  {
    id: 'diarrhea',
    label: 'مطهر معوي وإسهال',
    triggers: [
      'اسهال', 'إسهال', 'تطهير معوي', 'مطهر معوي', 'نزله معويه', 'نزلة معوية', 'تلبك معوي'
    ],
    medicineMatchTerms: [
      'انتينال', 'antinal', 'مطهر معوي', 'اسهال', 'إسهال', 'نزلات معوية', 'نيفوروكسازيد', 'nifuroxazide'
    ]
  },
  {
    id: 'acidity_heartburn',
    label: 'حموضة وارتجاع المريء',
    triggers: [
      'حموضه', 'حموضة', 'حرقان', 'حرقان معده', 'ارتجاع', 'ارتجاع مريء', 'قرحه', 'قرحة', 'حمو'
    ],
    medicineMatchTerms: [
      'جاستروزول', 'gastrozole', 'اوميبرازول', 'omeprazole', 'حموضة', 'قرحة المعدة', 'ارتجاع المريء', 'حموضه'
    ]
  },
  {
    id: 'bones_joints',
    label: 'العظام والمفاصل والأسنان',
    triggers: [
      'عظام', 'مفاصل', 'روماتيزم', 'ظهر', 'الم ظهر', 'ركبه', 'ركبة', 'فقرات',
      'اسنان', 'أسنان', 'ضرس', 'وجع اسنان', 'عضلات', 'شد عضلي', 'خشونة'
    ],
    medicineMatchTerms: [
      'بروفين', 'brufen', 'كيتوفان', 'ketofan', 'ايبوبروفين', 'ibuprofen',
      'كيتوبروفين', 'ketoprofen', 'مسكن لآلام العظام', 'مفاصل', 'اسنان', 'مضاد للالتهاب'
    ]
  },
  {
    id: 'blood_pressure_heart',
    label: 'الضغط والقلب',
    triggers: [
      'ضغط', 'ضغط دم', 'ضغط عالي', 'قلب', 'نبضات', 'ذبحه', 'ذبحة', 'شرايين', 'ضغط مرتفع'
    ],
    medicineMatchTerms: [
      'كونكور', 'concor', 'بيسوبرولول', 'bisoprolol', 'ضغط الدم', 'القلب', 'ادوية القلب والضغط'
    ]
  },
  {
    id: 'antibiotic',
    label: 'مضاد حيوي والتهابات',
    triggers: [
      'مضاد حيوي', 'مضاد', 'التهاب', 'صديد', 'بكتيريا', 'خراج', 'التهاب لوز', 'لوز', 'حلق', 'زور', 'مسالك'
    ],
    medicineMatchTerms: [
      'اوجمنتين', 'augmentin', 'هاي بيوتك', 'hibiotic', 'اموكسيسيلين', 'amoxicillin',
      'مضاد حيوي', 'مضادات حيوية', 'التهابات'
    ]
  },
  {
    id: 'vitamins_immunity',
    label: 'فيتامينات ومقويات ومناعة',
    triggers: [
      'فيتامين', 'فيتامينات', 'مناعه', 'مناعة', 'مقوي', 'مكمل', 'نشاط', 'ارهاق',
      'تعب', 'تركيز', 'ذاكره', 'ذاكرة', 'اوميجا', 'أوميجا', 'زيت سمك', 'انيميا', 'حديد'
    ],
    medicineMatchTerms: [
      'اوميجا', 'omega', 'زيت السمك', 'فيتامينات ومكملات غذائية', 'مكمل غذائي', 'صحة القلب', 'الذاكرة والمناعة'
    ]
  }
];

/**
 * Checks whether a medicine matches a natural language or symptom query.
 * Supports:
 * 1. Exact or partial trade name, English name, active ingredient, barcode.
 * 2. Stop words removal (e.g. "دوا لخفض الحرارة" -> "خفض الحرارة").
 * 3. Prefix stripping (e.g. "للصداع" -> "صداع").
 * 4. Medical symptom & indication semantic mapping (e.g. "سخونية" -> Panadol, Cetal, Brufen).
 */
export function smartMatchesMedicineQuery(m: Medicine, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;

  const normalizedQuery = norm(rawQuery).trim();

  // 1. First build the medicine's full searchable corpus
  const searchableParts = [
    m.name,
    m.nameAr,
    m.nameEn,
    m.active,
    m.manufacturer,
    m.group,
    m.origin,
    m.code,
    m.barcode,
    m.details,
    m.dose,
    m.conc,
    m.otc
  ]
    .filter(Boolean)
    .map(norm);

  const fullHaystack = searchableParts.join(' ');
  const compactHaystack = fullHaystack.replace(/\s+/g, '');

  // 2. Direct exact or substring match check
  if (fullHaystack.includes(normalizedQuery) || compactHaystack.includes(compact(normalizedQuery))) {
    return true;
  }

  // 3. Extract meaningful words (filter out stop words and clean Arabic prefixes)
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const meaningfulTokens = queryTokens
    .map(cleanArabicWord)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  // If after cleaning we still have tokens, check if all or most tokens match the haystack
  if (meaningfulTokens.length > 0) {
    const allTokensMatch = meaningfulTokens.every(
      (tok) => fullHaystack.includes(tok) || compactHaystack.includes(compact(tok))
    );
    if (allTokensMatch) return true;
  }

  // 4. Semantic Symptom & Intent Rules
  // Check if user's query triggers any known symptom rule
  for (const rule of SYMPTOM_RULES) {
    const isTriggered = rule.triggers.some((trig) => {
      const normTrig = norm(trig);
      return (
        normalizedQuery.includes(normTrig) ||
        meaningfulTokens.some((t) => t === normTrig || normTrig.includes(t))
      );
    });

    if (isTriggered) {
      // If triggered, check if this medicine satisfies this symptom rule
      const medicineMatchesRule = rule.medicineMatchTerms.some((term) => {
        const normTerm = norm(term);
        return fullHaystack.includes(normTerm) || compactHaystack.includes(compact(normTerm));
      });

      // Special rule: if user also requested "اطفال" (children), verify medicine is suitable for children (syrup, drops, or explicit kids label)
      const hasChildTrigger = queryTokens.some((t) => {
        const clean = cleanArabicWord(t);
        return ['اطفال', 'طفل', 'بيبي', 'رضيع', 'رضع'].includes(clean);
      });

      if (hasChildTrigger) {
        const isChildForm =
          fullHaystack.includes('شراب') ||
          fullHaystack.includes('نقط') ||
          fullHaystack.includes('سيرب') ||
          fullHaystack.includes('اطفال') ||
          (m.dose && (m.dose.includes('شراب') || m.dose.includes('نقط')));

        if (medicineMatchesRule && isChildForm) {
          return true;
        }
      } else if (medicineMatchesRule) {
        return true;
      }
    }
  }

  // 5. Partial token match fallback: if at least 60% of meaningful words match
  if (meaningfulTokens.length >= 2) {
    const matchedCount = meaningfulTokens.filter(
      (tok) => fullHaystack.includes(tok) || compactHaystack.includes(compact(tok))
    ).length;

    if (matchedCount / meaningfulTokens.length >= 0.6) {
      return true;
    }
  }

  return false;
}
