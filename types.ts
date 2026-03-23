
export interface Company {
  id: string;
  name: string;
  rfc?: string;
  logo: string;
  address: string;
  phone: string;
  website: string;
  bankDetails: string;
  taxRate?: number; // Tasa de impuesto personalizada (default 0.16 = 16% IVA)
  primaryColor?: string; // Color de marca para reportes y UI
}

export interface Quote {
  id: string;
  companyId: string;
  quoteNumber: string;
  date: string;

  // Client info
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;

  // Items and calculations
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;

  // Optional fields (new features, backward compatible)
  notes?: string;
  serviceConditions?: string;
  discount?: number; // Descuento global opcional
  currency?: 'MXN' | 'USD';
  contactId?: string; // Vinculación con CRM Contact
  vigenciaDias?: number; // Vigencia de la cotización en días

  // Status and metadata
  status: 'draft' | 'created' | 'sold';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteItem {
  id?: string;
  internalId?: string; // ID interno para keys de React y drag & drop
  description: string;
  quantity: number;
  price: number;
  discount?: number; // Descuento porcentual legacy
  discountType?: 'percent' | 'amount'; // Tipo de descuento
  discountValue?: number; // Valor del descuento
  displayStyle?: 'normal' | 'highlight' | 'small'; // Estilo visual del item
  notes?: string;
}

// Tipo para perfiles de usuario
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  companyId?: string;  // Empresa asignada
  status: 'pending' | 'active' | 'disabled';
  createdAt: string;
  lastLogin: string;
  preferences?: {
    defaultCompanyId?: string;
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
}

// ===================== CRM Types =====================

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  tags: string[];
  source: string; // "Referido", "Web", "LinkedIn", "Llamada", etc.
  notes: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type DealStage = 'prospect' | 'contacted' | 'quoted' | 'negotiation' | 'closed_won' | 'closed_lost';

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  prospect: 'Prospecto',
  contacted: 'Contactado',
  quoted: 'Cotizado',
  negotiation: 'Negociación',
  closed_won: 'Cerrado Ganado',
  closed_lost: 'Cerrado Perdido',
};

export const DEAL_STAGE_ORDER: DealStage[] = ['prospect', 'contacted', 'quoted', 'negotiation', 'closed_won', 'closed_lost'];

export interface Deal {
  id: string;
  contactId: string;
  companyId: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number; // 0-100
  expectedCloseDate: string;
  quoteIds: string[];
  notes: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'follow_up';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Llamada',
  email: 'Correo',
  meeting: 'Reunión',
  task: 'Tarea',
  follow_up: 'Seguimiento',
};

export interface Activity {
  id: string;
  contactId?: string;
  dealId?: string;
  type: ActivityType;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string | null;
  createdBy?: string;
  createdAt: string;
}

