/**
 * Demo store - works without Supabase for client demos
 * Uses AsyncStorage for persistence across app restarts
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CUSTOMERS: '@fireapp_demo_customers',
  INSPECTIONS: '@fireapp_demo_inspections',
  INVOICES: '@fireapp_demo_invoices',
  INVOICE_ITEMS: '@fireapp_demo_invoice_items',
  INVOICE_LINE_ITEMS: '@fireapp_demo_invoice_line_items',
  SESSION: '@fireapp_demo_session',
} as const;

export interface DemoCustomer {
  id: string;
  customer_name: string;
  business_name: string;
  address?: string;
  suite?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  system_type?: string;
  last_service_date?: string;
  next_service_date?: string;
  created_at: string;
}

export interface DemoInvoice {
  id: string;
  customer_id: string;
  project_id?: string;
  inspection_id?: string;
  service_type?: string;
  invoice_date: string;
  amount: number;
  tax: number;
  total: number;
  payment_method?: string;
  payment_status?: string;
  pdf_url?: string;
  created_at: string;
}

export interface DemoInspection {
  id: string;
  customer_id: string;
  inspection_date: string;
  service_type?: 'installation' | 'inspection' | 'maintenance';
  system_brand?: string;
  system_model?: string;
  inspection_status?: 'pass' | 'fail' | 'needs_repair';
  phase?: string;
  notes?: string;
  technician_name?: string;
  created_at: string;
  // Full wizard data for report generation
  customerInfo?: Record<string, unknown>;
  systemInfo?: Record<string, unknown>;
  projectInfo?: Record<string, unknown>;
  permitStatus?: Record<string, unknown>;
  workProgress?: Record<string, unknown>;
  systemChecks?: Record<string, unknown>;
  inspectionSetup?: Record<string, unknown>;
  comments?: Record<string, unknown>;
  paymentInfo?: Record<string, unknown>;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const SEED_CUSTOMERS: DemoCustomer[] = [
  {
    id: 'demo-1',
    customer_name: 'John Doe',
    business_name: 'ABC Restaurant',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    phone: '555-1234',
    email: 'john@abc.com',
    system_type: 'Wet Chemical',
    last_service_date: '2024-09-15',
    next_service_date: '2025-03-15',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    customer_name: 'Jane Smith',
    business_name: 'Downtown Grill',
    address: '456 Oak Ave',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    phone: '555-5678',
    next_service_date: '2025-04-20',
    created_at: new Date().toISOString(),
  },
];

export interface DemoInvoiceItem {
  id: string;
  name?: string;
  description: string;
  price: number;
  active: boolean;
  sort_order?: number;
}

export interface DemoInvoiceLineItem {
  id: string;
  invoice_id: string;
  invoice_item_id?: string;
  description: string;
  price: number;
  quantity: number;
  tax_applied: boolean;
}

const DEFAULT_INVOICE_ITEMS: DemoInvoiceItem[] = [
  { id: 'demo-item-1', name: 'Fire Extinguisher Inspection', description: 'Annual inspection of fire extinguishers', price: 25, active: true, sort_order: 0 },
  { id: 'demo-item-2', name: 'Kitchen Hood Cleaning', description: 'Professional hood and duct cleaning', price: 150, active: true, sort_order: 1 },
  { id: 'demo-item-3', name: 'Fire Suppression System Service', description: 'Inspection and service of suppression system', price: 200, active: true, sort_order: 2 },
];

let customersCache: DemoCustomer[] | null = null;
let inspectionsCache: DemoInspection[] | null = null;
let invoicesCache: DemoInvoice[] | null = null;
let invoiceItemsCache: DemoInvoiceItem[] | null = null;
let invoiceLineItemsCache: DemoInvoiceLineItem[] | null = null;

async function loadCustomers(): Promise<DemoCustomer[]> {
  if (customersCache) return customersCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) {
      customersCache = JSON.parse(raw);
      return customersCache!;
    }
  } catch {
    // ignore
  }
  customersCache = [...SEED_CUSTOMERS];
  await saveCustomers();
  return customersCache;
}

async function saveCustomers(): Promise<void> {
  if (customersCache) {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CUSTOMERS,
      JSON.stringify(customersCache),
    );
  }
}

async function loadInspections(): Promise<DemoInspection[]> {
  if (inspectionsCache) return inspectionsCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.INSPECTIONS);
    if (raw) {
      inspectionsCache = JSON.parse(raw);
      return inspectionsCache!;
    }
  } catch {
    // ignore
  }
  inspectionsCache = [];
  await saveInspections();
  return inspectionsCache;
}

async function saveInspections(): Promise<void> {
  if (inspectionsCache) {
    await AsyncStorage.setItem(
      STORAGE_KEYS.INSPECTIONS,
      JSON.stringify(inspectionsCache),
    );
  }
}

async function loadInvoices(): Promise<DemoInvoice[]> {
  if (invoicesCache) return invoicesCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
    if (raw) {
      invoicesCache = JSON.parse(raw);
      return invoicesCache!;
    }
  } catch {
    // ignore
  }
  invoicesCache = [];
  await saveInvoices();
  return invoicesCache;
}

async function saveInvoices(): Promise<void> {
  if (invoicesCache) {
    await AsyncStorage.setItem(
      STORAGE_KEYS.INVOICES,
      JSON.stringify(invoicesCache),
    );
  }
}

async function loadInvoiceItems(): Promise<DemoInvoiceItem[]> {
  if (invoiceItemsCache) return invoiceItemsCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.INVOICE_ITEMS);
    if (raw) {
      invoiceItemsCache = JSON.parse(raw);
      return invoiceItemsCache!;
    }
  } catch {
    // ignore
  }
  invoiceItemsCache = [...DEFAULT_INVOICE_ITEMS];
  await saveInvoiceItems();
  return invoiceItemsCache;
}

async function saveInvoiceItems(): Promise<void> {
  if (invoiceItemsCache) {
    await AsyncStorage.setItem(
      STORAGE_KEYS.INVOICE_ITEMS,
      JSON.stringify(invoiceItemsCache),
    );
  }
}

async function loadInvoiceLineItems(): Promise<DemoInvoiceLineItem[]> {
  if (invoiceLineItemsCache) return invoiceLineItemsCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.INVOICE_LINE_ITEMS);
    if (raw) {
      invoiceLineItemsCache = JSON.parse(raw);
      return invoiceLineItemsCache!;
    }
  } catch {
    // ignore
  }
  invoiceLineItemsCache = [];
  await saveInvoiceLineItems();
  return invoiceLineItemsCache;
}

async function saveInvoiceLineItems(): Promise<void> {
  if (invoiceLineItemsCache) {
    await AsyncStorage.setItem(
      STORAGE_KEYS.INVOICE_LINE_ITEMS,
      JSON.stringify(invoiceLineItemsCache),
    );
  }
}

export const demoStore = {
  async getCustomers(): Promise<DemoCustomer[]> {
    return loadCustomers();
  },

  async getCustomer(id: string): Promise<DemoCustomer | null> {
    const list = await loadCustomers();
    return list.find(c => c.id === id) ?? null;
  },

  async createCustomer(data: Omit<DemoCustomer, 'id' | 'created_at'>): Promise<DemoCustomer> {
    const list = await loadCustomers();
    const customer: DemoCustomer = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    list.push(customer);
    customersCache = list;
    await saveCustomers();
    return customer;
  },

  async updateCustomer(
    id: string,
    data: Partial<Omit<DemoCustomer, 'id' | 'created_at'>>,
  ): Promise<DemoCustomer> {
    const list = await loadCustomers();
    const idx = list.findIndex(c => c.id === id);
    if (idx < 0) throw new Error('Customer not found');
    const updated = {...list[idx], ...data};
    list[idx] = updated;
    customersCache = list;
    await saveCustomers();
    return updated;
  },

  async getInvoice(id: string): Promise<DemoInvoice | null> {
    const list = await loadInvoices();
    return list.find(i => i.id === id) ?? null;
  },

  async getInvoiceItems(): Promise<DemoInvoiceItem[]> {
    const list = await loadInvoiceItems();
    return list.filter(i => i.active).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  },

  async getInvoiceLineItems(invoiceId: string): Promise<DemoInvoiceLineItem[]> {
    const list = await loadInvoiceLineItems();
    return list.filter(li => li.invoice_id === invoiceId);
  },

  async createInvoice(data: {
    customer_id: string;
    project_id?: string;
    inspection_id?: string;
    service_type?: string;
    invoice_date: string;
    amount: number;
    tax: number;
    total: number;
    payment_method?: string;
    payment_status?: string;
    pdf_url?: string;
    line_items?: Array<{ description: string; price: number; quantity?: number; tax_applied?: boolean; invoice_item_id?: string }>;
  }): Promise<DemoInvoice> {
    const list = await loadInvoices();
    const invoice: DemoInvoice = {
      id: generateId(),
      customer_id: data.customer_id,
      project_id: data.project_id,
      inspection_id: data.inspection_id,
      service_type: data.service_type,
      invoice_date: data.invoice_date,
      amount: data.amount,
      tax: data.tax,
      total: data.total,
      payment_method: data.payment_method,
      payment_status: data.payment_status,
      pdf_url: data.pdf_url,
      created_at: new Date().toISOString(),
    };
    list.unshift(invoice);
    invoicesCache = list;
    await saveInvoices();
    if (data.line_items && data.line_items.length > 0) {
      const lineItems = await loadInvoiceLineItems();
      for (const li of data.line_items) {
        lineItems.push({
          id: generateId(),
          invoice_id: invoice.id,
          invoice_item_id: li.invoice_item_id,
          description: li.description,
          price: li.price,
          quantity: li.quantity ?? 1,
          tax_applied: li.tax_applied ?? true,
        });
      }
      invoiceLineItemsCache = lineItems;
      await saveInvoiceLineItems();
    }
    return invoice;
  },

  async getInspection(id: string): Promise<DemoInspection | null> {
    const list = await loadInspections();
    return list.find(i => i.id === id) ?? null;
  },

  async getInspections(customerId?: string): Promise<DemoInspection[]> {
    const list = await loadInspections();
    if (customerId) {
      return list.filter(i => i.customer_id === customerId);
    }
    return list;
  },

  async getLastInspectionForCustomer(customerId: string): Promise<{
    systemInfo?: Record<string, unknown>;
    inspection_date?: string;
  } | null> {
    const list = await loadInspections();
    const filtered = list
      .filter(i => i.customer_id === customerId)
      .sort((a, b) => {
        const da = a.inspection_date ?? a.created_at ?? '';
        const db = b.inspection_date ?? b.created_at ?? '';
        return db.localeCompare(da);
      });
    const last = filtered[0];
    if (!last?.systemInfo) return null;
    return {
      systemInfo: last.systemInfo,
      inspection_date: last.inspection_date,
    };
  },

  async createInspection(data: {
    customer_id: string;
    service_type?: string;
    customerInfo?: unknown;
    systemInfo?: unknown;
    projectInfo?: unknown;
    permitStatus?: unknown;
    workProgress?: unknown;
    systemChecks?: unknown;
    inspectionSetup?: unknown;
    comments?: unknown;
    paymentInfo?: unknown;
  }): Promise<DemoInspection> {
    const list = await loadInspections();
    const sysInfo = data.systemInfo as {systemBrand?: string | string[]; systemModel?: string} | undefined;
    const inspSetup = data.inspectionSetup as {inspectionResult?: string} | undefined;
    const inspection: DemoInspection = {
      id: generateId(),
      customer_id: data.customer_id,
      service_type: data.service_type as DemoInspection['service_type'],
      inspection_date: new Date().toISOString().split('T')[0],
      system_brand: Array.isArray(sysInfo?.systemBrand)
        ? sysInfo.systemBrand.join(', ')
        : sysInfo?.systemBrand,
      system_model: sysInfo?.systemModel,
      inspection_status: (inspSetup?.inspectionResult as 'pass' | 'fail' | 'needs_repair') ?? 'pass',
      phase: 'completed',
      technician_name: 'Demo Technician',
      created_at: new Date().toISOString(),
      customerInfo: data.customerInfo as Record<string, unknown> | undefined,
      systemInfo: data.systemInfo as Record<string, unknown> | undefined,
      projectInfo: data.projectInfo as Record<string, unknown> | undefined,
      permitStatus: data.permitStatus as Record<string, unknown> | undefined,
      workProgress: data.workProgress as Record<string, unknown> | undefined,
      systemChecks: data.systemChecks as Record<string, unknown> | undefined,
      inspectionSetup: data.inspectionSetup as Record<string, unknown> | undefined,
      comments: data.comments as Record<string, unknown> | undefined,
      paymentInfo: data.paymentInfo as Record<string, unknown> | undefined,
    };
    list.unshift(inspection);
    inspectionsCache = list;
    await saveInspections();

    // Update customer next_service_date: 6 months from inspection date
    const inspDate = inspection.inspection_date ?? new Date().toISOString().split('T')[0];
    const d = new Date(inspDate);
    d.setMonth(d.getMonth() + 6);
    const nextDate = d.toISOString().split('T')[0];
    const customers = await loadCustomers();
    const custIdx = customers.findIndex(c => c.id === data.customer_id);
    if (custIdx >= 0) {
      customers[custIdx] = {
        ...customers[custIdx],
        last_service_date: inspDate,
        next_service_date: nextDate,
      };
      customersCache = customers;
      await saveCustomers();
    }

    return inspection;
  },

  async setSession(email: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({email}));
  },

  async getSession(): Promise<{email: string} | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  },

  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
  },
};
