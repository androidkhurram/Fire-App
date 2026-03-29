/**
 * Unified data service - uses Supabase when configured, else demo store
 */
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config';

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0]!;
}
import {supabase} from '../supabase/client';
import {demoStore, DemoCustomer, DemoInspection, DemoInvoice} from './demoStore';

export const useSupabase = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.length > 10,
);

export interface Customer {
  id: string;
  customer_name?: string;
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
}

export interface Invoice {
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
  created_at?: string;
}

export interface Inspection {
  id: string;
  customer_id: string;
  system_id?: string;
  inspection_date: string;
  service_type?: 'installation' | 'inspection' | 'maintenance';
  system_brand?: string;
  system_model?: string;
  inspection_status?: 'pass' | 'fail' | 'needs_repair';
  phase?: string;
  technician_name?: string;
  report_url?: string;
}

export interface SystemFieldTemplate {
  id: string;
  label: string;
  field_type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';
  required: boolean;
  active: boolean;
  sort_order?: number;
}

export interface System {
  id: string;
  customer_id: string;
  system_type?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  created_at?: string;
}

export interface InvoiceItem {
  id: string;
  name?: string;
  description: string;
  price: number;
  active: boolean;
  sort_order?: number;
}

export interface InvoiceLineItem {
  id?: string;
  invoice_id?: string;
  invoice_item_id?: string;
  description: string;
  price: number;
  quantity: number;
  tax_applied: boolean;
}

export interface SemiAnnualReportItem {
  id: string;
  description: string;
  sort_order: number;
  active: boolean;
  special_field_type?: 'psi' | 'lb' | 'old_links' | 'mfg_date' | null;
}

export interface SemiAnnualReport {
  id: string;
  customer_id?: string | null;
  created_by?: string | null;
  form_data: SemiAnnualReportFormData;
  pdf_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SemiAnnualReportFormData {
  reportType?: 'annual' | 'semi_annual' | 'certified';
  comments?: string;
  customerName?: string;
  date?: string;
  addressLine1?: string;
  addressLine2?: string;
  system1Label?: string;
  system2Label?: string;
  isCertificationOfOriginalInstallation?: boolean;
  copyLeftWithClient?: boolean;
  checklist?: Record<string, {system1: 'yes' | 'no'; system2: 'yes' | 'no'}>;
  item5_psi?: {system1?: string; system2?: string};
  item6_lb?: {system1?: string; system2?: string};
  item12_oldLinksLeftWith?: string;
  item20_mfgOrHTDate?: string;
  explanations?: Record<string, string>;
  inspectorName?: string;
  texasLicenseNumber?: string;
  inspectorSignature?: string;
  inspectionDate?: string;
  licensedCompany?: string;
  texasCertificateNumber?: string;
  customerAcknowledgementName?: string;
  customerAcknowledgementSignature?: string;
}

const DEFAULT_SEMI_ANNUAL_ITEMS: SemiAnnualReportItem[] = [
  {id: '1', description: 'Proper Hood and Duct Protection?', sort_order: 1, active: true, special_field_type: null},
  {id: '2', description: 'Proper Cooking Surface Protection?', sort_order: 2, active: true, special_field_type: null},
  {id: '3', description: 'Pipe/Conduit Secure and Correct?', sort_order: 3, active: true, special_field_type: null},
  {id: '4', description: 'Chemical Cylinder Full?', sort_order: 4, active: true, special_field_type: null},
  {id: '5', description: 'Cylinder Pressure Correct?', sort_order: 5, active: true, special_field_type: 'psi'},
  {id: '6', description: 'Cartridge Weight Correct?', sort_order: 6, active: true, special_field_type: 'lb'},
  {id: '7', description: 'System Actuation Tested? (Automatic - Terminal Detector)', sort_order: 7, active: true, special_field_type: null},
  {id: '8', description: 'System Actuation Tested? (Manual - Remote Pull Station)', sort_order: 8, active: true, special_field_type: null},
  {id: '9', description: 'Appliances Shut Down upon System Actuation? (Electrical)', sort_order: 9, active: true, special_field_type: null},
  {id: '10', description: 'Appliances Shut Down upon System Actuation? (Gas Fired)', sort_order: 10, active: true, special_field_type: null},
  {id: '11', description: 'All Appliances Under Exhaust Hood?', sort_order: 11, active: true, special_field_type: null},
  {id: '12', description: 'Fusible Links Changed?', sort_order: 12, active: true, special_field_type: 'old_links'},
  {id: '13', description: 'Discharge Nozzles Cleaned/Capped?', sort_order: 13, active: true, special_field_type: null},
  {id: '14', description: 'Gas Pilots Relit?', sort_order: 14, active: true, special_field_type: null},
  {id: '15', description: 'Filters have U.L. Listing?', sort_order: 15, active: true, special_field_type: null},
  {id: '16', description: 'Hood & Filters Reasonably Clean?', sort_order: 16, active: true, special_field_type: null},
  {id: '17', description: 'System is OK to Certify?', sort_order: 17, active: true, special_field_type: null},
  {id: '18', description: 'System is Red Tagged?', sort_order: 18, active: true, special_field_type: null},
  {id: '19', description: 'Kitchen Personnel Instructed in System/Portables Operation?', sort_order: 19, active: true, special_field_type: null},
  {id: '20', description: '40B:C Rated Portable Fire Extinguisher Installed?', sort_order: 20, active: true, special_field_type: 'mfg_date'},
];

export const dataService = {
  async signIn(email: string, password: string): Promise<{ok: boolean; error?: string}> {
    if (useSupabase) {
      const {data, error} = await supabase.auth.signInWithPassword({email, password});
      if (error) return {ok: false, error: error.message};
      // Session is persisted automatically via AsyncStorage (supabase client config)
      return {ok: true};
    }
    // Demo mode: allow any credentials
    await demoStore.setSession(email);
    return {ok: true};
  },

  async signOut(): Promise<void> {
    if (useSupabase) {
      await supabase.auth.signOut();
    } else {
      await demoStore.clearSession();
    }
  },

  async getSession(): Promise<{email: string; displayName?: string} | null> {
    if (useSupabase) {
      const {data} = await supabase.auth.getSession();
      const user = data.session?.user;
      const email = user?.email;
      if (!email) return null;
      let displayName: string | undefined;
      const meta = user?.user_metadata as {full_name?: string} | undefined;
      if (meta?.full_name) {
        displayName = meta.full_name;
      } else {
        const {data: profile} = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        if (profile?.name) displayName = profile.name;
      }
      if (!displayName) {
        const localPart = email.split('@')[0] ?? '';
        displayName = localPart
          .replace(/[._]/g, ' ')
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
          .trim() || email;
      }
      return {email, displayName};
    }
    const session = await demoStore.getSession();
    if (!session) return null;
    const localPart = session.email.split('@')[0] ?? '';
    const displayName =
      localPart
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .trim() || session.email;
    return {email: session.email, displayName};
  },

  async getCustomers(): Promise<Customer[]> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('customers')
        .select('*')
        .order('created_at', {ascending: false});
      if (error) throw error;
      return (data ?? []) as Customer[];
    }
    const list = await demoStore.getCustomers();
    return list.map(mapDemoCustomer);
  },

  async getCustomer(id: string): Promise<Customer | null> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return data as Customer;
    }
    const c = await demoStore.getCustomer(id);
    return c ? mapDemoCustomer(c) : null;
  },

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    if (useSupabase) {
      const {data: row, error} = await supabase
        .from('customers')
        .insert({
          customer_name: data.customer_name,
          business_name: data.business_name ?? '',
          address: data.address,
          suite: data.suite,
          city: data.city,
          state: data.state,
          zip: data.zip,
          phone: data.phone,
          email: data.email,
          contact_person_name: data.contact_person_name,
          contact_person_phone: data.contact_person_phone,
          contact_person_email: data.contact_person_email,
          system_type: data.system_type ?? null,
          last_service_date: data.last_service_date ?? null,
          next_service_date: data.next_service_date ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return row as Customer;
    }
    const created = await demoStore.createCustomer({
      customer_name: data.customer_name ?? '',
      business_name: data.business_name ?? '',
      address: data.address,
      suite: data.suite,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone,
      email: data.email,
      contact_person_name: data.contact_person_name,
      contact_person_phone: data.contact_person_phone,
      contact_person_email: data.contact_person_email,
      system_type: data.system_type,
      last_service_date: data.last_service_date,
      next_service_date: data.next_service_date,
    });
    return mapDemoCustomer(created);
  },

  async getInspection(id: string): Promise<Inspection | null> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('inspections')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return data as Inspection;
    }
    const inv = await demoStore.getInspection(id);
    return inv ? mapDemoInspection(inv) : null;
  },

  async getInspections(customerId?: string): Promise<Inspection[]> {
    if (useSupabase) {
      let q = supabase.from('inspections').select('*').order('created_at', {ascending: false});
      if (customerId) q = q.eq('customer_id', customerId);
      const {data, error} = await q;
      if (error) throw error;
      return (data ?? []) as Inspection[];
    }
    const list = await demoStore.getInspections(customerId);
    return list.map(mapDemoInspection);
  },

  /** Last inspection/installation for a customer with full system info (for pre-fill on new inspection) */
  async getLastInspectionForCustomer(customerId: string): Promise<{
    systemInfo?: Record<string, unknown>;
    inspection_date?: string;
  } | null> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('inspections')
        .select('id, system_info_json, inspection_date')
        .eq('customer_id', customerId)
        .order('inspection_date', {ascending: false})
        .order('created_at', {ascending: false})
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as {system_info_json?: unknown; inspection_date?: string};
      if (row.system_info_json && typeof row.system_info_json === 'object') {
        return {
          systemInfo: row.system_info_json as Record<string, unknown>,
          inspection_date: row.inspection_date,
        };
      }
      return null;
    }
    const demo = await demoStore.getLastInspectionForCustomer(customerId);
    return demo;
  },

  async createInspection(payload: {
    customer_id: string;
    system_id?: string;
    service_type?: 'installation' | 'inspection' | 'maintenance';
    customerInfo?: unknown;
    systemInfo?: unknown;
    projectInfo?: unknown;
    permitStatus?: unknown;
    workProgress?: unknown;
    systemChecks?: unknown;
    inspectionSetup?: unknown;
    comments?: unknown;
    paymentInfo?: unknown;
    dynamicFieldValues?: Record<string, string>;
  }): Promise<Inspection> {
    const sysInfo = payload.systemInfo as {
      systemBrand?: string | string[];
      systemModel?: string;
      serialNumber?: string;
      systemType?: string;
    } | undefined;
    const systemBrandStr = Array.isArray(sysInfo?.systemBrand)
      ? sysInfo.systemBrand.join(', ')
      : sysInfo?.systemBrand ?? '';
    const permit = payload.permitStatus as {
      permitApplied?: boolean;
      permitStatus?: string;
      permitDocumentUrl?: string;
    } | undefined;
    const inspSetup = payload.inspectionSetup as {
      inspectionResult?: string;
      inspectionDate?: string;
    } | undefined;
    const systemChecks = payload.systemChecks as {responses?: Record<string, string>} | undefined;

    if (useSupabase) {
      let systemId = payload.system_id;
      if (!systemId && sysInfo) {
        const system = await this.createSystem({
          customer_id: payload.customer_id,
          system_type: sysInfo.systemType,
          brand: systemBrandStr,
          model: sysInfo.systemModel,
          serial_number: sysInfo.serialNumber,
        });
        systemId = system?.id;
      }

      const {data: {user}} = await supabase.auth.getUser();
      const inspectionDate =
        inspSetup?.inspectionDate || new Date().toISOString().split('T')[0];
      const {data, error} = await supabase
        .from('inspections')
        .insert({
          customer_id: payload.customer_id,
          system_id: systemId,
          technician_id: user?.id ?? null,
          service_type: payload.service_type ?? 'inspection',
          inspection_date: inspectionDate,
          system_brand: systemBrandStr || undefined,
          system_model: sysInfo?.systemModel,
          serial_number: sysInfo?.serialNumber,
          phase: 'completed',
          inspection_status: inspSetup?.inspectionResult ?? 'pass',
          permit_applied: permit?.permitApplied,
          permit_status: permit?.permitStatus,
          permit_document_url: permit?.permitDocumentUrl,
          notes: (payload.comments as {commentText?: string})?.commentText,
          system_info_json: payload.systemInfo ?? null,
          payment_info_json: payload.paymentInfo ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      const inspection = data as Inspection;

      if (payload.dynamicFieldValues && Object.keys(payload.dynamicFieldValues).length > 0) {
        await this.saveInspectionFieldValues(inspection.id, payload.dynamicFieldValues);
      }

      if (systemChecks?.responses) {
        const items = Object.entries(systemChecks.responses).map(([item_name, status]) => ({
          item_name,
          status: (status === 'yes' ? 'pass' : status === 'no' ? 'fail' : 'na') as 'pass' | 'fail' | 'na',
        }));
        if (items.length > 0) await this.saveInspectionItems(inspection.id, items);
      }

      // Update customer next_service_date: 6 months from inspection date
      const nextDate = addMonths(inspectionDate, 6);
      await this.updateCustomer(payload.customer_id, {
        last_service_date: inspectionDate,
        next_service_date: nextDate,
      });

      return inspection;
    }
    const created = await demoStore.createInspection(payload);
    return mapDemoInspection(created);
  },

  async getSystemFieldTemplates(): Promise<SystemFieldTemplate[]> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('system_field_templates')
        .select('id, label, field_type, required, active, sort_order')
        .eq('active', true)
        .order('sort_order', {ascending: true});
      if (error) return [];
      return (data ?? []) as SystemFieldTemplate[];
    }
    return [];
  },

  async getSystemBrands(): Promise<string[]> {
    const {DEFAULT_SYSTEM_BRANDS} = await import('../constants/formOptions');
    const defaults = [...DEFAULT_SYSTEM_BRANDS];
    if (useSupabase) {
      const {data, error} = await supabase
        .from('system_brands')
        .select('name')
        .order('sort_order', {ascending: true});
      if (!error && data?.length) {
        const fromDb = (data as {name: string}[]).map(r => r.name);
        const merged = [...defaults];
        for (const b of fromDb) {
          if (!merged.includes(b)) merged.push(b);
        }
        return merged;
      }
    }
    return defaults;
  },

  async getSystemChecks(): Promise<string[]> {
    const {DEFAULT_SYSTEM_CHECKS} = await import('../constants/formOptions');
    const defaults = [...DEFAULT_SYSTEM_CHECKS];
    if (useSupabase) {
      const {data, error} = await supabase
        .from('system_checks')
        .select('label')
        .eq('active', true)
        .order('sort_order', {ascending: true});
      if (!error && data?.length) {
        return (data as {label: string}[]).map(r => r.label);
      }
    }
    return defaults;
  },

  async getSemiAnnualReportItems(): Promise<SemiAnnualReportItem[]> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('semi_annual_report_items')
        .select('*')
        .eq('active', true)
        .order('sort_order', {ascending: true});
      if (!error && data?.length) {
        return data as SemiAnnualReportItem[];
      }
    }
    return DEFAULT_SEMI_ANNUAL_ITEMS;
  },

  async createSemiAnnualReport(formData: SemiAnnualReportFormData, customerId?: string | null): Promise<SemiAnnualReport | null> {
    if (useSupabase) {
      const {data: session} = await supabase.auth.getSession();
      const {data, error} = await supabase
        .from('semi_annual_reports')
        .insert({
          customer_id: customerId ?? null,
          created_by: session.session?.user?.id ?? null,
          form_data: formData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) return null;
      return data as SemiAnnualReport;
    }
    return null;
  },

  async updateSemiAnnualReport(id: string, formData: SemiAnnualReportFormData, pdfUrl?: string, customerId?: string | null): Promise<SemiAnnualReport | null> {
    if (useSupabase) {
      const updates: Record<string, unknown> = {form_data: formData, updated_at: new Date().toISOString()};
      if (pdfUrl != null) updates.pdf_url = pdfUrl;
      if (customerId !== undefined) updates.customer_id = customerId;
      const {data, error} = await supabase
        .from('semi_annual_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return null;
      return data as SemiAnnualReport;
    }
    return null;
  },

  async getSemiAnnualReports(customerId?: string): Promise<SemiAnnualReport[]> {
    if (useSupabase) {
      let q = supabase
        .from('semi_annual_reports')
        .select('*')
        .order('created_at', {ascending: false});
      if (customerId) q = q.eq('customer_id', customerId);
      const {data, error} = await q;
      if (error) return [];
      return (data ?? []) as SemiAnnualReport[];
    }
    return [];
  },

  async getSemiAnnualReport(id: string): Promise<SemiAnnualReport | null> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('semi_annual_reports')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return data as SemiAnnualReport;
    }
    return null;
  },

  async getSystemBrandModels(brandName: string): Promise<string[]> {
    const BRAND_DEFAULT_MODELS: Record<string, string[]> = {
      Protex: ['L1600', 'L3000C', 'L4600C', 'L6000C'],
      PyroChem: ['PCL-160', 'PCL-300', 'PCL-460', 'PCL-600'],
      'Kidde-range Guard': ['1.6 Gal', '3 Gal', '4.6 Gal', '6 Gal'],
      Buckeye: ['BFR-5', 'BFR-10', 'BFR-15', 'BFR-20'],
      Ansul: ['1.5 Gal', '3 Gal'],
      Amerex: ['275', '375', '475', '600'],
    };
    const defaultModels = BRAND_DEFAULT_MODELS[brandName] ?? ['L1600', 'L3000C', 'L4600C', 'L6000C'];
    if (useSupabase) {
      const {data: brandRow} = await supabase
        .from('system_brands')
        .select('id')
        .eq('name', brandName)
        .single();
      if (brandRow) {
        const {data: models, error} = await supabase
          .from('system_brand_models')
          .select('name')
          .eq('brand_id', (brandRow as {id: string}).id)
          .order('sort_order', {ascending: true});
        if (!error && models?.length) {
          return (models as {name: string}[]).map(m => m.name);
        }
      }
    }
    return defaultModels;
  },

  async createSystem(payload: {
    customer_id: string;
    system_type?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
  }): Promise<System | null> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('systems')
        .insert({
          customer_id: payload.customer_id,
          system_type: payload.system_type,
          brand: payload.brand,
          model: payload.model,
          serial_number: payload.serial_number,
        })
        .select()
        .single();
      if (error) return null;
      return data as System;
    }
    return null;
  },

  async uploadFile(
    bucket: string,
    path: string,
    file: {uri: string; type?: string; name?: string},
  ): Promise<string | null> {
    if (!useSupabase) return null;
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const {data, error} = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          upsert: true,
          contentType: file.type ?? 'application/pdf',
        });
      if (error) return null;
      const {data: urlData} = supabase.storage.from(bucket).getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch {
      return null;
    }
  },

  async saveInspectionFieldValues(
    inspectionId: string,
    values: Record<string, string>,
  ): Promise<void> {
    if (!useSupabase) return;
    for (const [fieldId, value] of Object.entries(values)) {
      if (value == null || value === '') continue;
      await supabase.from('inspection_field_values').upsert(
        {inspection_id: inspectionId, field_id: fieldId, value},
        {onConflict: 'inspection_id,field_id'},
      );
    }
  },

  async saveInspectionItems(
    inspectionId: string,
    items: Array<{item_name: string; status: 'pass' | 'fail' | 'na'}>,
  ): Promise<void> {
    if (!useSupabase) return;
    await supabase.from('inspection_items').insert(
      items.map(({item_name, status}) => ({
        inspection_id: inspectionId,
        item_name,
        status,
      })),
    );
  },

  async uploadInspectionPhoto(
    inspectionId: string,
    file: {uri: string; type?: string; name?: string},
  ): Promise<string | null> {
    if (!useSupabase) return file.uri; // Demo: return local URI
    const path = `photos/${inspectionId}/${Date.now()}-${file.name ?? 'photo.jpg'}`;
    const url = await this.uploadFile('inspection-photos', path, {
      ...file,
      type: file.type ?? 'image/jpeg',
    });
    if (!url) return null;
    const {data: {user}} = await supabase.auth.getUser();
    await supabase.from('photos').insert({
      inspection_id: inspectionId,
      photo_url: url,
      uploaded_by: user?.id ?? null,
    });
    return url;
  },

  async updateInspectionReportUrl(inspectionId: string, reportUrl: string): Promise<void> {
    if (useSupabase) {
      await supabase
        .from('inspections')
        .update({report_url: reportUrl})
        .eq('id', inspectionId);
    }
  },

  async getInspectionItems(
    inspectionId: string,
  ): Promise<Array<{item_name: string; status: 'pass' | 'fail' | 'na'}>> {
    if (!useSupabase) return [];
    const {data, error} = await supabase
      .from('inspection_items')
      .select('item_name, status')
      .eq('inspection_id', inspectionId);
    if (error || !data) return [];
    return data as Array<{item_name: string; status: 'pass' | 'fail' | 'na'}>;
  },

  async getInspectionPhotos(inspectionId: string): Promise<Array<{photo_url: string}>> {
    if (!useSupabase) return [];
    const {data, error} = await supabase
      .from('photos')
      .select('photo_url')
      .eq('inspection_id', inspectionId);
    if (error || !data) return [];
    return data as Array<{photo_url: string}>;
  },

  async getInvoiceItems(): Promise<InvoiceItem[]> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('invoice_items')
        .select('id, name, description, price, active, sort_order')
        .eq('active', true)
        .order('sort_order', {ascending: true});
      if (error) return [];
      return (data as InvoiceItem[]) ?? [];
    }
    return demoStore.getInvoiceItems();
  },

  async getInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('invoice_line_items')
        .select('id, invoice_id, invoice_item_id, description, price, quantity, tax_applied')
        .eq('invoice_id', invoiceId)
        .order('created_at', {ascending: true});
      if (error) return [];
      return (data as InvoiceLineItem[]) ?? [];
    }
    return demoStore.getInvoiceLineItems(invoiceId);
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return data as Invoice;
    }
    const inv = await demoStore.getInvoice(id);
    return inv ? mapDemoInvoice(inv) : null;
  },

  async updateInvoice(
    id: string,
    updates: {pdf_url?: string},
  ): Promise<void> {
    if (useSupabase) {
      const {error} = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    }
    // Demo store: pdf_url not persisted for now
  },

  async createInvoice(payload: {
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
    line_items?: InvoiceLineItem[];
  }): Promise<Invoice> {
    if (useSupabase) {
      const {data, error} = await supabase
        .from('invoices')
        .insert({
          customer_id: payload.customer_id,
          project_id: payload.project_id,
          inspection_id: payload.inspection_id,
          service_type: payload.service_type,
          invoice_date: payload.invoice_date,
          amount: payload.amount,
          tax: payload.tax,
          total: payload.total,
          payment_method: payload.payment_method,
          payment_status: payload.payment_status,
          pdf_url: payload.pdf_url,
        })
        .select()
        .single();
      if (error) throw error;
      const invoice = data as Invoice;
      if (payload.line_items && payload.line_items.length > 0) {
        const rows = payload.line_items.map(li => ({
          invoice_id: invoice.id,
          invoice_item_id: li.invoice_item_id ?? null,
          description: li.description,
          price: li.price,
          quantity: li.quantity ?? 1,
          tax_applied: li.tax_applied ?? true,
        }));
        const {error: lineError} = await supabase.from('invoice_line_items').insert(rows);
        if (lineError) throw lineError;
      }
      return invoice;
    }
    const created = await demoStore.createInvoice(payload);
    return mapDemoInvoice(created);
  },

  async uploadInvoicePdf(
    invoiceId: string,
    file: {uri: string; type?: string; name?: string},
  ): Promise<string | null> {
    if (!useSupabase) return null;
    const path = `invoices/${invoiceId}-${Date.now()}.pdf`;
    const url = await this.uploadFile('invoice-pdfs', path, {
      ...file,
      type: file.type ?? 'application/pdf',
    });
    return url;
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    if (useSupabase) {
      const {data: row, error} = await supabase
        .from('customers')
        .update({
          customer_name: data.customer_name,
          business_name: data.business_name,
          address: data.address,
          suite: data.suite,
          city: data.city,
          state: data.state,
          zip: data.zip,
          phone: data.phone,
          email: data.email,
          contact_person_name: data.contact_person_name,
          contact_person_phone: data.contact_person_phone,
          contact_person_email: data.contact_person_email,
          system_type: data.system_type,
          last_service_date: data.last_service_date,
          next_service_date: data.next_service_date,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return row as Customer;
    }
    const updated = await demoStore.updateCustomer(id, data);
    return mapDemoCustomer(updated);
  },

  async getUserPermissions(): Promise<{
    can_create_installation: boolean;
    can_create_inspection: boolean;
    can_create_invoice: boolean;
  }> {
    if (useSupabase) {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user?.id) {
        return {can_create_installation: true, can_create_inspection: true, can_create_invoice: true};
      }
      const {data} = await supabase
        .from('users')
        .select('can_create_installation, can_create_inspection, can_create_invoice')
        .eq('id', user.id)
        .single();
      return {
        can_create_installation: data?.can_create_installation ?? true,
        can_create_inspection: data?.can_create_inspection ?? true,
        can_create_invoice: data?.can_create_invoice ?? true,
      };
    }
    return {can_create_installation: true, can_create_inspection: true, can_create_invoice: true};
  },
};

function mapDemoCustomer(c: DemoCustomer): Customer {
  return {
    id: c.id,
    customer_name: c.customer_name,
    business_name: c.business_name,
    address: c.address,
    suite: c.suite,
    city: c.city,
    state: c.state,
    zip: c.zip,
    phone: c.phone,
    email: c.email,
    contact_person_name: c.contact_person_name,
    contact_person_phone: c.contact_person_phone,
    contact_person_email: c.contact_person_email,
    system_type: c.system_type,
    last_service_date: c.last_service_date,
    next_service_date: c.next_service_date,
  };
}

function mapDemoInspection(i: DemoInspection): Inspection {
  return {
    id: i.id,
    customer_id: i.customer_id,
    inspection_date: i.inspection_date,
    service_type: i.service_type,
    system_brand: i.system_brand,
    system_model: i.system_model,
    inspection_status: i.inspection_status,
    phase: i.phase,
    technician_name: i.technician_name,
  };
}

function mapDemoInvoice(i: DemoInvoice): Invoice {
  return {
    id: i.id,
    customer_id: i.customer_id,
    project_id: i.project_id,
    service_type: i.service_type,
    invoice_date: i.invoice_date,
    amount: i.amount,
    tax: i.tax,
    total: i.total,
    payment_method: i.payment_method,
    payment_status: i.payment_status,
    pdf_url: i.pdf_url,
    created_at: i.created_at,
  };
}
