export interface UnitOption {
  key: string;
  label: string;
  price: number;
  stock: number;
}

export interface Medicine {
  id: string | number;
  name: string;
  nameAr?: string;
  nameEn?: string;
  active: string;
  price: number;
  price1: number;
  price2: number;
  qty: number;
  qty1: number;
  qty2: number;
  unit1: string;
  unit2: string;
  boxPrice?: number;
  boxStock?: number;
  stripPrice?: number;
  stripStock?: number;
  img?: string;
  details?: string;
  manufacturer?: string;
  conc?: string;
  dose?: string;
  group?: string;
  origin?: string;
  otc?: string;
  category?: string;
  code?: string;
  barcode?: string;
  raw?: any;
}

export interface CartItem {
  id: string; // unique item id + unitKey
  medicineId: string | number;
  name: string;
  price: number;
  qty: number;
  unitKey: string;
  unitLabel: string;
  maxStock: number;
  raw?: any;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number | null;
  medicine_id: string | number | null;
}

export interface Order {
  id: string | number;
  customer_name: string;
  customer_phone: string;
  address: string;
  notes?: string | null;
  items: OrderItem[];
  total: number;
  status: 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  user_id?: string;
  created_at: string;
}

export interface CustomerProfile {
  user_id: string;
  full_name: string;
  phone: string;
  customer_number: number;
}

export interface RegisteredCustomer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  registeredAt: string;
  totalOrders?: number;
  totalSpent?: number;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: {
    id: string;
    email: string;
  };
}

export interface CosmeticItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
}

export interface PrescriptionExtractedMedicine {
  name: string;
  nameAr?: string;
  dosage?: string;
  frequency?: string;
  matchedMedicine?: Medicine;
  isAvailable: boolean;
  selectedUnit?: string;
}

export interface PrescriptionAnalysisResult {
  doctorSpecialty?: string;
  notes?: string;
  medicines: PrescriptionExtractedMedicine[];
  rawImage?: string;
}

export interface MissingMedicineRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  medicineName: string;
  notes?: string;
  createdAt: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  fulfilledAt?: string;
  source?: 'search' | 'prescription' | 'direct';
}
