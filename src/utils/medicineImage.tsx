import React, { useState } from 'react';
import { Medicine } from '../types';

// Curated high quality medicine images for Egyptian & general pharmacy items
const MEDICINE_PRESET_IMAGES: Record<string, string> = {
  // Paracetamol & Pain killers
  panadol: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
  paracetamol: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
  cetal: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=500&auto=format&fit=crop&q=80',
  brufen: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=80',
  ibuprofen: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=80',
  ketofan: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&auto=format&fit=crop&q=80',
  cataflam: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&auto=format&fit=crop&q=80',
  
  // Antibiotics
  augmentin: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
  hibiotic: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&auto=format&fit=crop&q=80',
  amoxicillin: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
  
  // Heart & Blood pressure
  concor: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
  bisoprolol: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
  
  // Cold & Flu
  congestal: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
  flutab: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
  
  // Digestive & Antacid
  antinal: 'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=500&auto=format&fit=crop&q=80',
  gastrozole: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=500&auto=format&fit=crop&q=80',
  omeprazole: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=500&auto=format&fit=crop&q=80',
  
  // Vitamins
  omega: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=80',
  vitamin: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=80'
};

// Generic fallback images based on dosage form
const DOSAGE_FORM_IMAGES = {
  syrup: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=500&auto=format&fit=crop&q=80',
  drops: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=80',
  cream: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
  capsule: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
  tablet: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80'
};

/**
 * Returns a valid, appealing image URL for any medicine.
 * Checks:
 * 1. Explicit medicine.img
 * 2. Keyword matches in medicine name or active ingredient
 * 3. Dosage form detection (syrup, drops, cream, capsule, tablet)
 * 4. Default clean pharmaceutical packaging photo
 */
export function getMedicineImageUrl(medicine: Partial<Medicine> | null | undefined): string {
  if (!medicine) return DOSAGE_FORM_IMAGES.tablet;

  // 1. If explicit valid image is provided, use it
  if (medicine.img && typeof medicine.img === 'string' && medicine.img.trim().length > 5) {
    return medicine.img.trim();
  }

  const nameText = `${medicine.name || ''} ${medicine.nameAr || ''} ${medicine.nameEn || ''} ${medicine.active || ''}`.toLowerCase();

  // 2. Check preset medicines
  for (const [key, url] of Object.entries(MEDICINE_PRESET_IMAGES)) {
    if (nameText.includes(key)) {
      return url;
    }
  }

  // 3. Check dosage form
  const doseText = `${medicine.dose || ''} ${nameText}`.toLowerCase();
  if (doseText.includes('شراب') || doseText.includes('syrup') || doseText.includes('suspension')) {
    return DOSAGE_FORM_IMAGES.syrup;
  }
  if (doseText.includes('قطرة') || doseText.includes('drops')) {
    return DOSAGE_FORM_IMAGES.drops;
  }
  if (doseText.includes('كريم') || doseText.includes('cream') || doseText.includes('مرهم') || doseText.includes('ointment') || doseText.includes('جل') || doseText.includes('gel')) {
    return DOSAGE_FORM_IMAGES.cream;
  }
  if (doseText.includes('كبسول') || doseText.includes('capsule')) {
    return DOSAGE_FORM_IMAGES.capsule;
  }

  // 4. Default pharmaceutical packaging
  return DOSAGE_FORM_IMAGES.tablet;
}

interface MedicineThumbnailProps {
  medicine: Partial<Medicine>;
  className?: string;
  imageClassName?: string;
  showBadge?: boolean;
}

export const MedicineThumbnail: React.FC<MedicineThumbnailProps> = ({
  medicine,
  className = 'w-full h-32 sm:h-36',
  imageClassName = 'w-full h-full object-cover',
  showBadge = true
}) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getMedicineImageUrl(medicine);

  return (
    <div
      className={`relative bg-gradient-to-br from-[#f8fbff] to-[#edf4fc] border border-[#e2edf8] rounded-xl overflow-hidden flex items-center justify-center ${className}`}
    >
      {!hasError ? (
        <img
          src={imageUrl}
          alt={medicine.name || 'دواء'}
          loading="lazy"
          className={`${imageClassName} transition-transform duration-300 hover:scale-105`}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0755b8] flex items-center justify-center text-xl font-bold shadow-2xs mb-1">
            💊
          </div>
          <span className="text-[11px] font-bold text-[#15345b] line-clamp-1 max-w-[120px]">
            {medicine.name || 'دواء'}
          </span>
        </div>
      )}

      {/* Optional OTC or Dose Tag */}
      {showBadge && medicine.dose && (
        <span className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
          {medicine.dose.split(' ')[0]}
        </span>
      )}
    </div>
  );
};
