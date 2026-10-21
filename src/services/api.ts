import {
  OLD_SUPABASE_URL,
  OLD_SUPABASE_KEY,
  NEW_SUPABASE_URL,
  NEW_SUPABASE_KEY,
  LOCAL_INVENTORY_KEY,
  LOCAL_DELETED_MEDS_KEY,
  LOCAL_ORDERS_KEY,
  LOCAL_COSMETICS_KEY,
  LOCAL_CUSTOMERS_KEY,
  LOCAL_MISSING_MEDS_KEY,
  SESSION_STORAGE_KEY,
  PENDING_PROFILE_KEY,
  PHARMACY_LOGO_KEY
} from '../constants/api';
import { INITIAL_MEDICINES, INITIAL_COSMETICS } from '../constants/sampleData';
import {
  Medicine,
  UnitOption,
  Order,
  CustomerProfile,
  AuthSession,
  CosmeticItem,
  RegisteredCustomer,
  MissingMedicineRequest,
  PrescriptionExtractedMedicine
} from '../types';
import { getMedicineImageUrl } from '../utils/medicineImage';
import { smartMatchesMedicineQuery } from '../utils/medicalSearch';

import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_PHARMACY_LOGO } from '../constants/logo';

export function getPharmacyLogo(): string {
  try {
    return localStorage.getItem(PHARMACY_LOGO_KEY) || DEFAULT_PHARMACY_LOGO;
  } catch (e) {
    return DEFAULT_PHARMACY_LOGO;
  }
}

export function savePharmacyLogo(logoDataUrl: string | null) {
  try {
    if (logoDataUrl) {
      localStorage.setItem(PHARMACY_LOGO_KEY, logoDataUrl);
      window.dispatchEvent(new CustomEvent('pharmacy_logo_updated', { detail: logoDataUrl }));
    } else {
      localStorage.removeItem(PHARMACY_LOGO_KEY);
      window.dispatchEvent(new CustomEvent('pharmacy_logo_updated', { detail: DEFAULT_PHARMACY_LOGO }));
    }
  } catch (e) {
    console.error('Failed to save pharmacy logo', e);
  }
}

export function norm(x: any): string {
  const s = String(x ?? '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, ch => String('٠١٢٣٤٥٦٧٨٩'.indexOf(ch)))
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

export function compact(x: any): string {
  return norm(x).replace(/\s+/g, '');
}

export function num(v: any): number {
  if (v == null || v === '') return 0;
  const n = parseFloat(String(v).replace(',', '.').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function pick(o: any, keys: string[]): string {
  if (!o) return '';
  for (const k of keys) {
    if (o[k] != null && String(o[k]).trim()) {
      return String(o[k]).trim();
    }
  }
  return '';
}

export function mapRawMedicine(d: any): Medicine {
  const q1 = num(d?.qty1 ?? d?.qty_1 ?? d?.quantity1);
  const q2 = num(d?.qty2 ?? d?.qty_2 ?? d?.quantity2);
  const p = num(d?.price);
  const p1 = num(d?.price1) || p;
  const p2 = num(d?.price2) || p;
  const u1 = String(d?.unit1 || 'علبة').trim();
  const u2 = String(d?.unit2 || 'شريط').trim();

  const boxPrice = num(d?.box_price) || (u1 === 'علبة' ? p1 : 0);
  const boxStock = num(d?.box_stock) || (u1 === 'علبة' ? q1 : 0);
  const stripPrice = num(d?.strip_price) || (u1 === 'شريط' ? p1 : (u2 === 'شريط' ? p2 : 0));
  const stripStock = num(d?.strip_stock) || (u1 === 'شريط' ? q1 : (u2 === 'شريط' ? q2 : 0));

  const name = pick(d, ['name', 'name_ar', 'commercial_name', 'drug_name', 'medicine_name', 'name_en']) || 'دواء';
  const nameAr = pick(d, ['name_ar', 'name']);
  const nameEn = pick(d, ['name_en', 'trade_name_en']);
  const active = pick(d, ['active', 'active_ingredient', 'scientific_name', 'generic_name']);

  return {
    raw: d,
    id: d?.id || d?.item_key || d?.code || d?.barcode || nameAr || nameEn || Math.random().toString(),
    name,
    nameAr,
    nameEn,
    active,
    price: p || p1,
    price1: p1,
    price2: p2,
    qty: q1 + q2 > 0 ? q1 + q2 : num(d?.qty || d?.stock || 0),
    qty1: q1,
    qty2: q2,
    unit1: u1,
    unit2: u2,
    boxPrice,
    boxStock,
    stripPrice,
    stripStock,
    img: pick(d, ['image_data_url', 'image_url', 'image', 'photo_url', 'photo', 'img']) || getMedicineImageUrl({ name, nameAr, nameEn, active, dose: pick(d, ['dosage_form', 'form', 'dose_form']) }),
    details: pick(d, ['indications', 'uses', 'description', 'details', 'notes', 'instructions']),
    manufacturer: pick(d, ['company', 'manufacturer', 'manufacturer_name']),
    conc: pick(d, ['concentration', 'strength']),
    dose: pick(d, ['dosage_form', 'form', 'dose_form']),
    group: d?.group || '',
    origin: d?.origin || '',
    otc: pick(d, ['otc', 'is_otc', 'category']),
    code: pick(d, ['code', 'item_code']),
    barcode: pick(d, ['barcode', 'international_barcode'])
  };
}

export function isMedicineDivisibleIntoStrips(m: Medicine): boolean {
  // If explicitly has unit2 === 'شريط' or stripStock > 0 or stripPrice > 0
  if (m.unit2 === 'شريط' || (m.stripStock ?? 0) > 0 || (m.stripPrice ?? 0) > 0) return true;

  // Non-divisible dosage forms / items (syrups, drops, creams, ointments, sprays, lotions)
  const nonDivisibleKeywords = [
    'شراب', 'syrup', 'suspension', 'قطرة', 'drops', 'eye drops', 'ear drops',
    'مرهم', 'ointment', 'كريم', 'cream', 'gel', 'جل', 'شامبو', 'shampoo',
    'غسول', 'lotion', 'mouthwash', 'مضمضة', 'بخاخ', 'spray', 'inhaler',
    'محلول', 'solution', 'زيت', 'oil', 'بودرة', 'powder'
  ];

  const text = `${m.name} ${m.dose || ''} ${m.details || ''} ${m.unit1 || ''}`.toLowerCase();
  for (const kw of nonDivisibleKeywords) {
    if (text.includes(kw)) {
      return false;
    }
  }

  // Divisible forms (tablets, capsules, effervescent, sachets, ampoules)
  const divisibleKeywords = [
    'قرص', 'أقراص', 'tablet', 'tab', 'كبسول', 'كبسولات', 'capsule', 'cap',
    'شريط', 'strip', 'فوار', 'effervescent', 'كيس', 'أكياس', 'sachet',
    'أمبول', 'ampoule', 'تحاميل', 'لبوس', 'suppository'
  ];
  for (const kw of divisibleKeywords) {
    if (text.includes(kw)) return true;
  }

  // Default: if unit1 is 'علبة' or unspecified, standard Egyptian medicine box contains strips
  return m.unit1 === 'علبة' || !m.unit1;
}

export function getUnitOptions(m: Medicine): UnitOption[] {
  const out: UnitOption[] = [];
  const isDivisible = isMedicineDivisibleIntoStrips(m);

  // 1. Box option (علبة)
  const boxStock = m.qty1 > 0 ? m.qty1 : (m.boxStock ?? 0);
  const boxPrice = m.price1 > 0 ? m.price1 : (m.boxPrice || m.price);
  const boxLabel = m.unit1 || 'علبة';

  if (boxStock > 0 && boxPrice > 0) {
    out.push({
      key: 'u1',
      label: boxLabel,
      price: boxPrice,
      stock: boxStock
    });
  }

  // 2. Strip option (شريط)
  if (isDivisible) {
    // Determine strip price: use price2/stripPrice if set, otherwise default to half the box price (standard 2 strips/box)
    let stripPrice = m.price2 > 0 ? m.price2 : (m.stripPrice ?? 0);
    if (!stripPrice && boxPrice > 0) {
      stripPrice = Number((boxPrice / 2).toFixed(2));
    }

    // Determine strip stock: direct strips in stock + strips dispenseable from full boxes (2 per box)
    const explicitStripStock = m.qty2 > 0 ? m.qty2 : (m.stripStock ?? 0);
    const stripsFromBoxes = boxStock > 0 ? boxStock * 2 : 0;
    const totalStripStock = explicitStripStock > 0 ? explicitStripStock + stripsFromBoxes : stripsFromBoxes;

    if (totalStripStock > 0 && stripPrice > 0) {
      out.push({
        key: 'u2',
        label: m.unit2 && m.unit2 !== 'علبة' ? m.unit2 : 'شريط',
        price: stripPrice,
        stock: totalStripStock
      });
    }
  }

  // Fallback: If neither was added, but generic stock exists
  if (out.length === 0 && m.qty > 0 && m.price > 0) {
    out.push({
      key: 'base',
      label: m.unit1 || 'وحدة',
      price: m.price,
      stock: m.qty
    });
  }

  return out;
}

export function isAvailable(m: Medicine): boolean {
  return getUnitOptions(m).length > 0;
}

export function stockDescription(m: Medicine): string {
  const opts = getUnitOptions(m);
  if (!opts.length) return 'غير متوفر حالياً';
  const hasBox = opts.some((o) => o.label === 'علبة');
  const hasStrip = opts.some((o) => o.label === 'شريط');
  if (hasBox && hasStrip) {
    return 'متاح: علبة أو شريط';
  }
  return opts.map((o) => `${o.label}: ${o.stock}`).join(' · ');
}

export function matchesMedicineQuery(m: Medicine, query: string): boolean {
  return smartMatchesMedicineQuery(m, query);
}

// Supabase REST Helper
async function apiCall(baseUrl: string, apiKey: string, path: string, options: RequestInit = {}, token?: string | null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(baseUrl + path, {
      ...options,
      signal: controller.signal,
      headers: {
        apikey: apiKey,
        Authorization: 'Bearer ' + (token || apiKey),
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || `HTTP ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const INVENTORY_SYNC_EVENT = 'HEBA_PHARMACY_INVENTORY_SYNC';

let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('heba_pharmacy_inventory_channel');
  }
} catch (e) {}

export function broadcastInventoryUpdate(meds: Medicine[]) {
  // 1. BroadcastChannel across browser tabs
  try {
    syncChannel?.postMessage({ type: 'INVENTORY_UPDATED', medicines: meds });
  } catch (e) {}
  // 2. CustomEvent within same window
  try {
    window.dispatchEvent(new CustomEvent(INVENTORY_SYNC_EVENT, { detail: meds }));
  } catch (e) {}
}

export function subscribeToInventoryUpdates(callback: (meds: Medicine[]) => void): () => void {
  const handleCustomEvent = (e: any) => {
    if (e.detail && Array.isArray(e.detail)) {
      callback(e.detail);
    }
  };

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data?.type === 'INVENTORY_UPDATED' && Array.isArray(event.data.medicines)) {
      callback(event.data.medicines);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === LOCAL_INVENTORY_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) {
          callback(parsed);
        }
      } catch (e) {}
    }
  };

  window.addEventListener(INVENTORY_SYNC_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  if (syncChannel) {
    syncChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener(INVENTORY_SYNC_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

// Manage explicitly deleted medicine IDs so deleted items never come back on refresh
export function getDeletedMedicineIds(): Set<string> {
  try {
    const saved = localStorage.getItem(LOCAL_DELETED_MEDS_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) return new Set(arr.map(String));
    }
  } catch (e) {}
  return new Set();
}

export function recordDeletedMedicineId(id: string | number) {
  try {
    const deletedSet = getDeletedMedicineIds();
    deletedSet.add(String(id));
    localStorage.setItem(LOCAL_DELETED_MEDS_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch (e) {
    console.error('Failed to record deleted medicine ID', e);
  }
}

export function recordDeletedMedicineIds(ids: (string | number)[]) {
  try {
    const deletedSet = getDeletedMedicineIds();
    ids.forEach((id) => deletedSet.add(String(id)));
    localStorage.setItem(LOCAL_DELETED_MEDS_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch (e) {
    console.error('Failed to record deleted medicine IDs', e);
  }
}

export function clearDeletedMedicineIds() {
  try {
    localStorage.removeItem(LOCAL_DELETED_MEDS_KEY);
  } catch (e) {}
}

// Load inventory from Supabase with fallback to localStorage and sample data
export async function fetchInventory(): Promise<{ medicines: Medicine[]; source: 'remote' | 'local' }> {
  const deletedIds = getDeletedMedicineIds();

  // Check local customized inventory first if saved
  let localCustomized: Medicine[] | null = null;
  try {
    const saved = localStorage.getItem(LOCAL_INVENTORY_KEY);
    if (saved) {
      const parsed: Medicine[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Exclude any recorded deleted items and ensure image URL exists
        localCustomized = parsed
          .filter((m) => !deletedIds.has(String(m.id)))
          .map((m) => ({
            ...m,
            img: m.img && m.img.trim().length > 5 ? m.img : getMedicineImageUrl(m)
          }));
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    const rows = await apiCall(
      OLD_SUPABASE_URL,
      OLD_SUPABASE_KEY,
      '/rest/v1/pharmacy_inventory?select=*&order=name_ar.asc&limit=1000',
      { headers: { 'Cache-Control': 'no-cache' } }
    );

    if (Array.isArray(rows) && rows.length > 0) {
      // Map remote rows and exclude any deleted IDs
      const mapped = rows
        .map((r) => mapRawMedicine(r))
        .filter((m) => !deletedIds.has(String(m.id)));
      
      // If user has local inventory, prioritize it so deleted or edited items are fully preserved
      let merged: Medicine[];
      if (localCustomized && localCustomized.length > 0) {
        // Keep local edits & additions, append any new remote rows that were not deleted
        const localIds = new Set(localCustomized.map((m) => String(m.id)));
        const newRemoteAdditions = mapped.filter((m) => !localIds.has(String(m.id)) && !deletedIds.has(String(m.id)));
        merged = [...localCustomized, ...newRemoteAdditions];
      } else if (localCustomized && localCustomized.length === 0 && deletedIds.size > 0) {
        // All items or specific items were deleted locally
        merged = mapped;
      } else {
        merged = mapped;
      }

      // Filter again against deleted IDs and ensure images are set
      merged = merged
        .filter((m) => !deletedIds.has(String(m.id)))
        .map((m) => ({
          ...m,
          img: m.img && m.img.trim().length > 5 ? m.img : getMedicineImageUrl(m)
        }));

      // Save to local storage
      try {
        localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(merged));
      } catch (e) {}
      return { medicines: merged, source: 'remote' };
    }
  } catch (err) {
    console.warn('Could not fetch remote inventory, falling back to cached or sample data:', err);
  }

  if (localCustomized && localCustomized.length > 0) {
    const localIds = new Set(localCustomized.map((m) => String(m.id)));
    const missingInitials = INITIAL_MEDICINES.filter(
      (m) => !localIds.has(String(m.id)) && !deletedIds.has(String(m.id))
    );
    const combined = [...localCustomized, ...missingInitials];
    const cleanLocal = combined
      .filter((m) => !deletedIds.has(String(m.id)))
      .map((m) => ({
        ...m,
        img: m.img && m.img.trim().length > 5 ? m.img : getMedicineImageUrl(m)
      }));
    try {
      localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(cleanLocal));
    } catch (e) {}
    return { medicines: cleanLocal, source: 'local' };
  }

  const cleanInitial = INITIAL_MEDICINES
    .filter((m) => !deletedIds.has(String(m.id)))
    .map((m) => ({
      ...m,
      img: m.img && m.img.trim().length > 5 ? m.img : getMedicineImageUrl(m)
    }));
  return { medicines: cleanInitial, source: 'local' };
}

// Save inventory modifications locally and broadcast to all windows
export function saveLocalInventory(meds: Medicine[]) {
  try {
    localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(meds));
    broadcastInventoryUpdate(meds);
  } catch (e) {
    console.error('Failed to save local inventory', e);
  }
}

// Insert medicine remotely to Supabase pharmacy_inventory and sync locally
export async function createMedicineRemote(med: Medicine): Promise<boolean> {
  const payload = {
    item_key: String(med.id),
    code: med.code || null,
    barcode: med.barcode || null,
    name_ar: med.nameAr || med.name,
    name_en: med.nameEn || null,
    active: med.active || null,
    company: med.manufacturer || null,
    price: med.price || 0,
    qty1: med.qty1 || 0,
    unit1: med.unit1 || '',
    qty2: med.qty2 || 0,
    unit2: med.unit2 || '',
    image_data_url: med.img || null
  };

  try {
    await apiCall(
      OLD_SUPABASE_URL,
      OLD_SUPABASE_KEY,
      '/rest/v1/pharmacy_inventory',
      {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      }
    );
    return true;
  } catch (err) {
    console.warn('Could not save medicine to remote Supabase:', err);
    return false;
  }
}

// Update medicine remotely to Supabase pharmacy_inventory and sync locally
export async function updateMedicineRemote(med: Medicine): Promise<boolean> {
  const payload: any = {
    code: med.code || null,
    barcode: med.barcode || null,
    name_ar: med.nameAr || med.name,
    name_en: med.nameEn || null,
    active: med.active || null,
    company: med.manufacturer || null,
    price: med.price || 0,
    qty1: med.qty1 || 0,
    unit1: med.unit1 || '',
    qty2: med.qty2 || 0,
    unit2: med.unit2 || '',
    image_data_url: med.img || null
  };

  try {
    await apiCall(
      OLD_SUPABASE_URL,
      OLD_SUPABASE_KEY,
      `/rest/v1/pharmacy_inventory?item_key=eq.${encodeURIComponent(String(med.id))}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      }
    );
    return true;
  } catch (err) {
    console.warn('Could not update medicine in remote Supabase:', err);
    return false;
  }
}

// Delete medicine remotely from Supabase pharmacy_inventory and sync locally
export async function deleteMedicineRemote(id: string | number): Promise<boolean> {
  try {
    await apiCall(
      OLD_SUPABASE_URL,
      OLD_SUPABASE_KEY,
      `/rest/v1/pharmacy_inventory?item_key=eq.${encodeURIComponent(String(id))}`,
      {
        method: 'DELETE'
      }
    );
    return true;
  } catch (err) {
    console.warn('Could not delete medicine from remote Supabase:', err);
    return false;
  }
}

// Cosmetics API
export function loadCosmetics(): CosmeticItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_COSMETICS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return INITIAL_COSMETICS;
}

export function saveCosmetics(items: CosmeticItem[]) {
  try {
    localStorage.setItem(LOCAL_COSMETICS_KEY, JSON.stringify(items));
  } catch (e) {}
}

// Session Management
export function getSavedSession(): AuthSession | null {
  try {
    const s = localStorage.getItem(SESSION_STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {}
}

export async function loginWithPassword(email: string, password: string): Promise<AuthSession> {
  try {
    const data = await apiCall(NEW_SUPABASE_URL, NEW_SUPABASE_KEY, '/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (!data?.access_token) {
      throw new Error(data?.msg || data?.message || 'البريد أو كلمة المرور غير صحيحة.');
    }
    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    };
    saveSession(session);
    return session;
  } catch (err: any) {
    // If network fails, allow seamless local demo session
    console.warn('Remote login failed, testing demo credentials:', err);
    if (email && password.length >= 8) {
      const demoSession: AuthSession = {
        access_token: 'local-demo-token-' + Date.now(),
        user: { id: 'user-' + email.replace(/[^a-zA-Z0-9]/g, ''), email }
      };
      saveSession(demoSession);
      return demoSession;
    }
    throw new Error(err.message || 'تعذر تسجيل الدخول. تأكد من البيانات المدخلة.');
  }
}

export async function signupCustomer(
  email: string,
  password: string,
  fullName: string,
  phone: string
): Promise<AuthSession> {
  try {
    localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify({ full_name: fullName, phone }));
  } catch (e) {}

  try {
    const data = await apiCall(NEW_SUPABASE_URL, NEW_SUPABASE_KEY, '/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      })
    });

    if (data?.access_token && data?.user?.id) {
      const session: AuthSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        user: { id: data.user.id, email: data.user.email }
      };
      saveSession(session);
      await createCustomerProfile(data.user.id, fullName, phone, session.access_token);
      recordRegisteredCustomer({ fullName, phone, email, registeredAt: new Date().toISOString() });
      return session;
    }
  } catch (err) {
    console.warn('Remote signup error, using local registration:', err);
  }

  // Graceful local account
  const localSession: AuthSession = {
    access_token: 'local-session-' + Date.now(),
    user: { id: 'user-' + Date.now(), email }
  };
  saveSession(localSession);
  recordRegisteredCustomer({ fullName, phone, email, registeredAt: new Date().toISOString() });
  return localSession;
}

export function recordRegisteredCustomer(data: {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  registeredAt?: string;
}) {
  try {
    const saved = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
    let list: RegisteredCustomer[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(list)) list = [];

    const cleanPhone = (data.phone || '').replace(/[^\d]/g, '');
    const cleanEmail = (data.email || '').trim().toLowerCase();

    const existingIndex = list.findIndex(
      (c) =>
        (cleanPhone && c.phone.replace(/[^\d]/g, '') === cleanPhone) ||
        (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail)
    );

    const now = data.registeredAt || new Date().toISOString();
    let targetCust: RegisteredCustomer;
    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        fullName: data.fullName || list[existingIndex].fullName,
        phone: data.phone || list[existingIndex].phone,
        email: data.email || list[existingIndex].email,
        address: data.address || list[existingIndex].address
      };
      targetCust = list[existingIndex];
    } else {
      targetCust = {
        id: 'cust-' + (cleanPhone || Date.now()),
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        registeredAt: now,
        totalOrders: 0,
        totalSpent: 0
      };
      list.unshift(targetCust);
    }

    localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('new_customer_registered', { detail: data }));

    // Real-time Cloud Sync to Firestore
    try {
      const custDocId = targetCust.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
      setDoc(doc(db, 'customers', custDocId), {
        id: targetCust.id,
        full_name: targetCust.fullName,
        phone: targetCust.phone,
        address: targetCust.address || '',
        email: targetCust.email || '',
        created_at: targetCust.registeredAt,
        total_orders: targetCust.totalOrders || 0,
        total_spent: targetCust.totalSpent || 0
      }, { merge: true }).catch((err) => {
        console.warn('Firestore customer write error:', err);
      });
    } catch (e) {
      console.warn('Could not sync customer to Firestore:', e);
    }
  } catch (e) {
    console.error('Failed to record customer', e);
  }
}

export const INITIAL_DEMO_CUSTOMERS: RegisteredCustomer[] = [
  {
    id: 'cust-demo-1',
    fullName: 'أحمد محمود العبد',
    phone: '01012345678',
    email: 'ahmed.mahmoud@gmail.com',
    address: 'شارع 9، المعادي، القاهرة',
    registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    totalOrders: 2,
    totalSpent: 195.5
  },
  {
    id: 'cust-demo-2',
    fullName: 'سارة إبراهيم خليل',
    phone: '01123456789',
    email: 'sara.khalil@yahoo.com',
    address: 'شارع النصر، دجلة المعادي',
    registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    totalOrders: 1,
    totalSpent: 112.0
  }
];

export function fetchLocalCustomers(orders: Order[] = []): RegisteredCustomer[] {
  let list: RegisteredCustomer[] = [];
  try {
    const saved = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
    if (saved) {
      list = JSON.parse(saved);
    } else {
      list = [...INITIAL_DEMO_CUSTOMERS];
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    list = [...INITIAL_DEMO_CUSTOMERS];
  }

  if (!Array.isArray(list)) list = [...INITIAL_DEMO_CUSTOMERS];

  // Also include customers who placed orders
  const phoneMap = new Map<string, RegisteredCustomer>();
  list.forEach((c) => {
    const p = c.phone.replace(/[^\d]/g, '');
    if (p) phoneMap.set(p, c);
  });

  orders.forEach((order) => {
    if (!order.customer_phone) return;
    const p = order.customer_phone.replace(/[^\d]/g, '');
    if (!p) return;

    if (!phoneMap.has(p)) {
      const newCust: RegisteredCustomer = {
        id: 'cust-ord-' + order.id,
        fullName: order.customer_name || 'عميل بالطلب',
        phone: order.customer_phone,
        address: order.address,
        registeredAt: order.created_at || new Date().toISOString(),
        totalOrders: 1,
        totalSpent: order.total || 0
      };
      phoneMap.set(p, newCust);
      list.push(newCust);
    }
  });

  return list.map((cust) => {
    const p = cust.phone.replace(/[^\d]/g, '');
    const custOrders = orders.filter((o) => (o.customer_phone || '').replace(/[^\d]/g, '') === p);
    const totalSpent = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      ...cust,
      totalOrders: custOrders.length,
      totalSpent
    };
  });
}

export async function fetchRemoteCustomers(): Promise<RegisteredCustomer[]> {
  try {
    const snap = await getDocs(collection(db, 'customers'));
    const remoteList: RegisteredCustomer[] = [];
    snap.forEach((d) => {
      const data = d.data();
      remoteList.push({
        id: data.id || d.id,
        fullName: data.full_name || data.fullName || 'عميل مسجل',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        registeredAt: data.created_at || data.registeredAt || new Date().toISOString(),
        totalOrders: data.total_orders || data.totalOrders || 0,
        totalSpent: data.total_spent || data.totalSpent || 0
      });
    });

    if (remoteList.length > 0) {
      const saved = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
      let local: RegisteredCustomer[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(local)) local = [];

      const phoneSet = new Set(local.map((c) => (c.phone || '').replace(/[^\d]/g, '')));
      remoteList.forEach((r) => {
        const clean = (r.phone || '').replace(/[^\d]/g, '');
        if (clean && !phoneSet.has(clean)) {
          local.unshift(r);
          phoneSet.add(clean);
        }
      });
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(local));
      return local;
    }
  } catch (err) {
    console.warn('Failed to fetch remote customers:', err);
  }
  return fetchLocalCustomers();
}

export function subscribeToCustomers(callback: (customers: RegisteredCustomer[]) => void): () => void {
  try {
    return onSnapshot(collection(db, 'customers'), (snapshot) => {
      const list: RegisteredCustomer[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: data.id || d.id,
          fullName: data.full_name || data.fullName || 'عميل مسجل',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          registeredAt: data.created_at || data.registeredAt || new Date().toISOString(),
          totalOrders: data.total_orders || data.totalOrders || 0,
          totalSpent: data.total_spent || data.totalSpent || 0
        });
      });
      if (list.length > 0) {
        callback(list);
      }
    }, (err) => {
      console.warn('subscribeToCustomers error:', err);
    });
  } catch (e) {
    return () => {};
  }
}

export async function createCustomerProfile(userId: string, fullName: string, phone: string, token: string) {
  try {
    await apiCall(
      NEW_SUPABASE_URL,
      NEW_SUPABASE_KEY,
      '/rest/v1/customers',
      {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ user_id: userId, full_name: fullName, phone })
      },
      token
    );
  } catch (e) {
    console.warn('Customer profile creation error:', e);
  }
}

export async function fetchCustomerProfile(userId: string, token: string): Promise<CustomerProfile | null> {
  try {
    const rows = await apiCall(
      NEW_SUPABASE_URL,
      NEW_SUPABASE_KEY,
      `/rest/v1/customers?select=customer_number,full_name,phone,user_id&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      {},
      token
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch (e) {
    // fallback
  }

  // Try pending profile
  try {
    const p = localStorage.getItem(PENDING_PROFILE_KEY);
    if (p) {
      const parsed = JSON.parse(p);
      return {
        user_id: userId,
        full_name: parsed.full_name || 'عميل الصيدلية',
        phone: parsed.phone || '',
        customer_number: 1042
      };
    }
  } catch (e) {}

  return null;
}

// Orders Management
export function getLocalOrders(): Order[] {
  try {
    const s = localStorage.getItem(LOCAL_ORDERS_KEY);
    return s ? JSON.parse(s) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {}
}

export async function fetchOrders(userId?: string, _token?: string): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(150));
    const snap = await getDocs(q);
    const remoteOrders: Order[] = [];
    snap.forEach((docSnap) => {
      remoteOrders.push(docSnap.data() as Order);
    });
    if (remoteOrders.length > 0) {
      saveLocalOrders(remoteOrders);
      return remoteOrders.filter((o) => !userId || o.user_id === userId);
    }
  } catch (err) {
    console.warn('Firestore fetchOrders fallback to local orders:', err);
  }

  const localOrders = getLocalOrders();
  return localOrders.filter((o) => !userId || o.user_id === userId);
}

export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  try {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(150));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveOrders: Order[] = [];
        snapshot.forEach((d) => {
          liveOrders.push(d.data() as Order);
        });
        if (liveOrders.length > 0) {
          saveLocalOrders(liveOrders);
          callback(liveOrders);
        }
      },
      (error) => {
        console.warn('subscribeToOrders error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to subscribe to orders:', err);
    return () => {};
  }
}

export async function updateRemoteOrderStatus(orderId: string | number, newStatus: Order['status']) {
  try {
    const cleanId = String(orderId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    await updateDoc(doc(db, 'orders', cleanId), { status: newStatus });
  } catch (err) {
    console.warn('Failed to update remote order status in Firestore:', err);
  }
}

export async function submitOrder(
  orderData: {
    customer_name: string;
    customer_phone: string;
    address: string;
    notes?: string;
    items: { name: string; quantity: number; price: number | null; medicine_id: string | number | null }[];
    total: number;
    user_id?: string;
  },
  _token?: string | null
): Promise<Order> {
  const newOrder: Order = {
    id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    customer_name: orderData.customer_name,
    customer_phone: orderData.customer_phone,
    address: orderData.address,
    notes: orderData.notes || null,
    items: orderData.items,
    total: Number(orderData.total) || 0,
    status: 'new',
    user_id: orderData.user_id,
    created_at: new Date().toISOString()
  };

  // 1. Save to local storage first for instant response
  const current = getLocalOrders();
  const updated = [newOrder, ...current];
  saveLocalOrders(updated);

  // 2. Real-time Cloud Save to Firestore
  try {
    const orderDocRef = doc(db, 'orders', String(newOrder.id));
    await setDoc(orderDocRef, {
      id: String(newOrder.id),
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      address: newOrder.address,
      notes: newOrder.notes || '',
      items: newOrder.items,
      total: Number(newOrder.total) || 0,
      status: 'new',
      user_id: newOrder.user_id || '',
      created_at: newOrder.created_at
    });
  } catch (err) {
    console.warn('Could not post order to Firestore:', err);
  }

  // 3. Auto-record customer profile
  try {
    recordRegisteredCustomer({
      fullName: orderData.customer_name,
      phone: orderData.customer_phone,
      address: orderData.address
    });
  } catch (err) {}

  window.dispatchEvent(new CustomEvent('new_order_submitted', { detail: newOrder }));
  return newOrder;
}

// -------------------------------------------------------------
// Missing & Requested Medicines Tracking
// -------------------------------------------------------------

export const INITIAL_DEMO_MISSING_REQUESTS: MissingMedicineRequest[] = [
  {
    id: 'req-demo-1',
    customerName: 'محمود عبد الفتاح',
    customerPhone: '01098765432',
    medicineName: 'أوجمنتين 1 جم أقراص (Augmentin 1g)',
    notes: 'بحاجة إلى علبتين ضروري للوالد',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'pending',
    source: 'search'
  },
  {
    id: 'req-demo-2',
    customerName: 'منى عبد العال',
    customerPhone: '01187654321',
    medicineName: 'سيرفيتام كبسول (Cervitam Caps)',
    notes: 'بحث في التطبيق ولم يجد الدواء',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'fulfilled',
    fulfilledAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    source: 'search'
  }
];

export function fetchMissingMedicineRequests(): MissingMedicineRequest[] {
  try {
    const s = localStorage.getItem(LOCAL_MISSING_MEDS_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    }
    localStorage.setItem(LOCAL_MISSING_MEDS_KEY, JSON.stringify(INITIAL_DEMO_MISSING_REQUESTS));
    return INITIAL_DEMO_MISSING_REQUESTS;
  } catch (e) {
    return INITIAL_DEMO_MISSING_REQUESTS;
  }
}

export function saveMissingMedicineRequests(list: MissingMedicineRequest[]) {
  try {
    localStorage.setItem(LOCAL_MISSING_MEDS_KEY, JSON.stringify(list));
  } catch (e) {}
}

export function recordMissingMedicineRequest(data: {
  customerName: string;
  customerPhone: string;
  medicineName: string;
  notes?: string;
  source?: 'search' | 'prescription' | 'direct';
}): MissingMedicineRequest {
  const list = fetchMissingMedicineRequests();
  const newReq: MissingMedicineRequest = {
    id: 'req-' + Date.now(),
    customerName: data.customerName.trim() || 'عميل في الصيدلية',
    customerPhone: data.customerPhone.trim(),
    medicineName: data.medicineName.trim(),
    notes: data.notes?.trim() || '',
    createdAt: new Date().toISOString(),
    status: 'pending',
    source: data.source || 'search'
  };
  const updated = [newReq, ...list];
  saveMissingMedicineRequests(updated);

  // Sync to Firestore
  try {
    const docRef = doc(db, 'missing_medicines', newReq.id);
    setDoc(docRef, {
      id: newReq.id,
      medicine_name: newReq.medicineName,
      customer_name: newReq.customerName,
      customer_phone: newReq.customerPhone,
      notes: newReq.notes || '',
      status: 'pending',
      created_at: newReq.createdAt
    }).catch((err) => {
      console.warn('Firestore missing medicine write error:', err);
    });
  } catch (err) {
    console.warn('Could not sync missing medicine to Firestore:', err);
  }

  // Also record customer in directory if phone provided
  if (data.customerPhone) {
    recordRegisteredCustomer({
      fullName: data.customerName || 'عميل طلب دواء ناقص',
      phone: data.customerPhone,
      registeredAt: new Date().toISOString()
    });
  }

  // Dispatch live custom events for UI and Admin alerts
  window.dispatchEvent(new CustomEvent('missing_medicine_requested', { detail: newReq }));
  return newReq;
}

export function updateMissingMedicineStatus(id: string, status: 'pending' | 'fulfilled' | 'cancelled'): MissingMedicineRequest[] {
  const list = fetchMissingMedicineRequests();
  const updated = list.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        fulfilledAt: status === 'fulfilled' ? new Date().toISOString() : item.fulfilledAt
      };
    }
    return item;
  });
  saveMissingMedicineRequests(updated);
  window.dispatchEvent(new CustomEvent('missing_medicine_updated', { detail: { id, status } }));
  return updated;
}

export function deleteMissingMedicineRequest(id: string): MissingMedicineRequest[] {
  const list = fetchMissingMedicineRequests();
  const updated = list.filter((i) => i.id !== id);
  saveMissingMedicineRequests(updated);
  window.dispatchEvent(new CustomEvent('missing_medicine_updated', { detail: { id, deleted: true } }));
  return updated;
}

// -------------------------------------------------------------
// Doctor Prescription Analysis with Gemini API & Inventory Matching
// -------------------------------------------------------------

export async function analyzePrescriptionImage(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  success: boolean;
  medicines: Array<{ name: string; nameAr?: string; dosage?: string; frequency?: string }>;
  doctorSpecialty?: string;
  notes?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/analyze-prescription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: base64Data,
        mimeType
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `خطأ في الاتصال بالخادم (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Prescription analysis client error:', err);
    throw err;
  }
}

export function matchPrescriptionWithInventory(
  extractedList: Array<{ name: string; nameAr?: string; dosage?: string; frequency?: string }>,
  inventory: Medicine[]
): PrescriptionExtractedMedicine[] {
  return extractedList.map((item) => {
    const cleanName = norm(item.name || item.nameAr || '');
    const cleanAr = norm(item.nameAr || '');
    const cleanOrig = String(item.name || '').toLowerCase().trim();

    // Match against inventory
    let matched: Medicine | undefined = inventory.find((m) => {
      const mName = norm(m.name);
      const mAr = norm(m.nameAr);
      const mEn = norm(m.nameEn);
      const mActive = norm(m.active);
      const rawEn = String(m.nameEn || m.name || '').toLowerCase();

      return (
        (cleanOrig && rawEn.includes(cleanOrig)) ||
        (cleanName && (mName.includes(cleanName) || cleanName.includes(mName))) ||
        (cleanName && mEn && (mEn.includes(cleanName) || cleanName.includes(mEn))) ||
        (cleanAr && mAr && (mAr.includes(cleanAr) || cleanAr.includes(mAr))) ||
        (cleanName && mActive && (mActive.includes(cleanName) || cleanName.includes(mActive)))
      );
    });

    const available = matched ? isAvailable(matched) : false;

    return {
      name: item.name || item.nameAr || 'دواء بالروشتة',
      nameAr: item.nameAr,
      dosage: item.dosage,
      frequency: item.frequency,
      matchedMedicine: matched,
      isAvailable: available,
      selectedUnit: matched ? (matched.boxStock && matched.boxStock > 0 ? 'box' : 'strip') : undefined
    };
  });
}

