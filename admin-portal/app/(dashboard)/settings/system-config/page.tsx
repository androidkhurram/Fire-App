'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase-client';

type FieldType = 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';

interface SystemFieldTemplate {
  id: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

interface SystemBrand {
  id: string;
  name: string;
  sort_order: number;
  created_at?: string;
}

interface SystemBrandModel {
  id: string;
  brand_id: string;
  name: string;
  sort_order: number;
}

interface SystemCheck {
  id: string;
  label: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

interface InvoiceItem {
  id: string;
  name?: string;
  description: string;
  price: number;
  active: boolean;
  sort_order?: number | null;
  created_at?: string;
}

export default function SystemConfigPage() {
  const [activeSection, setActiveSection] = useState<'fields' | 'brands' | 'checks' | 'items' | 'semiAnnual'>('brands');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-600 mt-1">
          Manage custom fields, brands, and inspection checklist items. Changes reflect in the mobile app.
        </p>
      </div>

      {/* Section tabs: 1. Brands, 2. Checks, 3. Fields */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('brands')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeSection === 'brands'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🏷️ System Brands
        </button>
        <button
          onClick={() => setActiveSection('checks')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeSection === 'checks'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ✅ System Checks
        </button>
        <button
          onClick={() => setActiveSection('fields')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeSection === 'fields'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⚙️ System Fields
        </button>
        <button
          onClick={() => setActiveSection('items')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeSection === 'items'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📦 Invoice Items
        </button>
        <button
          onClick={() => setActiveSection('semiAnnual')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeSection === 'semiAnnual'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📋 Semi-Annual Report Items
        </button>
      </div>

      {activeSection === 'fields' && <SystemFieldsSection />}
      {activeSection === 'brands' && <SystemBrandsSection />}
      {activeSection === 'checks' && <SystemChecksSection />}
      {activeSection === 'items' && <InvoiceItemsSection />}
      {activeSection === 'semiAnnual' && <SemiAnnualReportItemsSection />}
    </div>
  );
}

interface SemiAnnualReportItem {
  id: string;
  description: string;
  sort_order: number;
  active: boolean;
  special_field_type?: string | null;
}

function SemiAnnualReportItemsSection() {
  const [items, setItems] = useState<SemiAnnualReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    active: true,
    sort_order: 0,
    special_field_type: '' as string,
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('semi_annual_report_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.error(error);
      setItems([]);
    } else {
      setItems((data as SemiAnnualReportItem[]) ?? []);
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const payload = {
        description: formData.description.trim(),
        active: formData.active,
        sort_order: formData.sort_order,
        special_field_type: formData.special_field_type || null,
      };
      if (editingId) {
        const { error } = await supabase
          .from('semi_annual_report_items')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('semi_annual_report_items').insert(payload);
        if (error) throw error;
      }
      setFormData({ description: '', active: true, sort_order: items.length, special_field_type: '' });
      setShowForm(false);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: SemiAnnualReportItem) => {
    setFormData({
      description: item.description,
      active: item.active,
      sort_order: item.sort_order ?? 0,
      special_field_type: item.special_field_type ?? '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this checklist item?')) return;
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const { error } = await supabase.from('semi_annual_report_items').delete().eq('id', id);
      if (error) throw error;
      await loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Semi-Annual Report Checklist Items</h2>
          <p className="text-sm text-gray-600 mt-1">
            Checklist items for the Semi-Annual Inspection Report form. Technicians respond Yes/No per system for each.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ description: '', active: true, sort_order: items.length, special_field_type: '' });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm"
        >
          + Add Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold mb-4">{editingId ? 'Edit Item' : 'Add Item'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g. Proper Hood and Duct Protection?"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Field Type</label>
              <select
                value={formData.special_field_type}
                onChange={(e) => setFormData({ ...formData, special_field_type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">None</option>
                <option value="psi">PSI (Cylinder Pressure)</option>
                <option value="lb">Lb (Cartridge Weight)</option>
                <option value="old_links">Old Links Left With</option>
                <option value="mfg_date">Mfg or H/T Date</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Special Field</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No checklist items yet. Add items above or run migrations to seed defaults.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{item.sort_order ?? 0}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-gray-600">{item.special_field_type ?? '—'}</td>
                  <td className="px-6 py-4">{item.active ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(item)} className="text-red-600 hover:text-red-800 mr-4 text-sm">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-gray-800 text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemFieldsSection() {
  const [fields, setFields] = useState<SystemFieldTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    field_type: 'text' as FieldType,
    required: false,
    active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadFields();
  }, []);

  async function loadFields() {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('system_field_templates')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.error(error);
      setFields([]);
    } else {
      setFields((data as SystemFieldTemplate[]) ?? []);
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('system_field_templates')
          .update({
            label: formData.label,
            field_type: formData.field_type,
            required: formData.required,
            active: formData.active,
            sort_order: formData.sort_order,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_field_templates').insert({
          label: formData.label,
          field_type: formData.field_type,
          required: formData.required,
          active: formData.active,
          sort_order: formData.sort_order,
        });
        if (error) throw error;
      }
      setFormData({ label: '', field_type: 'text', required: false, active: true, sort_order: 0 });
      setShowForm(false);
      setEditingId(null);
      await loadFields();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (f: SystemFieldTemplate) => {
    setFormData({
      label: f.label,
      field_type: f.field_type,
      required: f.required,
      active: f.active,
      sort_order: f.sort_order ?? 0,
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this field? It will no longer appear in the mobile app.')) return;
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const { error } = await supabase.from('system_field_templates').delete().eq('id', id);
      if (error) throw error;
      await loadFields();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Fields</h2>
          <p className="text-sm text-gray-600 mt-1">
            Custom fields shown in the System Information step of the inspection wizard.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ label: '', field_type: 'text', required: false, active: true, sort_order: 0 });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm"
        >
          + Add Field
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold mb-4">{editingId ? 'Edit Field' : 'Add Field'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g. Cylinder Pressure"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
              <select
                value={formData.field_type}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value as FieldType })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="checkbox">Checkbox</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Required</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                {editingId ? 'Update' : 'Add'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : fields.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No custom fields yet.</td></tr>
            ) : (
              fields.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{f.label}</td>
                  <td className="px-6 py-4 text-gray-600">{f.field_type}</td>
                  <td className="px-6 py-4">{f.required ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="px-6 py-4">{f.active ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="px-6 py-4 text-gray-600">{f.sort_order ?? 0}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(f)} className="text-red-600 hover:text-red-800 mr-4 text-sm">Edit</button>
                    <button onClick={() => handleDelete(f.id)} className="text-gray-600 hover:text-gray-800 text-sm">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemBrandsSection() {
  const [brands, setBrands] = useState<SystemBrand[]>([]);
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, SystemBrandModel[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', sort_order: 0 });
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const [addModelBrandId, setAddModelBrandId] = useState<string | null>(null);
  const [addModelName, setAddModelName] = useState('');

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    const supabase = createSupabaseClient();
    const { data: brandsData, error } = await supabase.from('system_brands').select('*').order('sort_order', { ascending: true });
    if (error) {
      console.error(error);
      setBrands([]);
    } else {
      const brandsList = (brandsData as SystemBrand[]) ?? [];
      setBrands(brandsList);
      const { data: modelsData } = await supabase.from('system_brand_models').select('*').order('sort_order', { ascending: true });
      const models = (modelsData as SystemBrandModel[]) ?? [];
      const byBrand: Record<string, SystemBrandModel[]> = {};
      for (const m of models) {
        if (!byBrand[m.brand_id]) byBrand[m.brand_id] = [];
        byBrand[m.brand_id].push(m);
      }
      setModelsByBrand(byBrand);
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      if (editingBrandId) {
        const { error } = await supabase.from('system_brands').update({ name: formData.name.trim(), sort_order: formData.sort_order }).eq('id', editingBrandId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_brands').insert({ name: formData.name.trim(), sort_order: formData.sort_order ?? brands.length });
        if (error) throw error;
      }
      setFormData({ name: '', sort_order: 0 });
      setShowForm(false);
      setEditingBrandId(null);
      await loadBrands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b: SystemBrand) => {
    setFormData({ name: b.name, sort_order: b.sort_order ?? 0 });
    setEditingBrandId(b.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const { error } = await supabase.from('system_brands').delete().eq('id', id);
      if (error) throw error;
      await loadBrands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleAddModel = async (e: React.FormEvent, brandId: string) => {
    e.preventDefault();
    if (!addModelName.trim()) return;
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const models = modelsByBrand[brandId] ?? [];
      const { error } = await supabase.from('system_brand_models').insert({ brand_id: brandId, name: addModelName.trim(), sort_order: models.length });
      if (error) throw error;
      setAddModelBrandId(null);
      setAddModelName('');
      await loadBrands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add model');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Delete this model?')) return;
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const { error } = await supabase.from('system_brand_models').delete().eq('id', modelId);
      if (error) throw error;
      await loadBrands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Brands</h2>
          <p className="text-sm text-gray-600 mt-1">
            Brands and models shown in the System Information step. Add models per brand.
          </p>
        </div>
        <button
          onClick={() => { setFormData({ name: '', sort_order: brands.length }); setEditingBrandId(null); setShowForm(true); }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm"
        >
          + Add Brand
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold mb-4">{editingBrandId ? 'Edit Brand' : 'Add Brand'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. FirePro" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">{editingBrandId ? 'Update' : 'Add'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingBrandId(null); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No brands yet.</td></tr>
            ) : (
              brands.map((b) => (
                <React.Fragment key={b.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <button onClick={() => setExpandedBrandId(expandedBrandId === b.id ? null : b.id)} className="text-left hover:underline">
                        {b.name} <span className="ml-2 text-gray-400">{expandedBrandId === b.id ? '▼' : '▶'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{b.sort_order ?? 0}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(b)} className="text-red-600 hover:text-red-800 mr-4 text-sm">Edit</button>
                      <button onClick={() => handleDelete(b.id)} className="text-gray-600 hover:text-gray-800 text-sm">Delete</button>
                    </td>
                  </tr>
                  {expandedBrandId === b.id && (
                    <tr key={`${b.id}-models`}>
                      <td colSpan={3} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Models</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(modelsByBrand[b.id] ?? []).map((m) => (
                              <span key={m.id} className="inline-flex items-center gap-1 px-3 py-1 bg-white border rounded">
                                {m.name}
                                <button onClick={() => handleDeleteModel(m.id)} className="text-red-600 hover:text-red-800 text-xs">×</button>
                              </span>
                            ))}
                          </div>
                          {addModelBrandId === b.id ? (
                            <form onSubmit={(e) => handleAddModel(e, b.id)} className="flex gap-2">
                              <input type="text" value={addModelName} onChange={(e) => setAddModelName(e.target.value)} placeholder="e.g. L3000" className="px-3 py-1 border rounded" />
                              <button type="submit" className="px-3 py-1 bg-red-600 text-white rounded text-sm">Add</button>
                              <button type="button" onClick={() => { setAddModelBrandId(null); setAddModelName(''); }} className="px-3 py-1 border rounded text-sm">Cancel</button>
                            </form>
                          ) : (
                            <button onClick={() => setAddModelBrandId(b.id)} className="text-sm text-red-600 hover:underline">+ Add model</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemChecksSection() {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ label: '', active: true, sort_order: 0 });

  useEffect(() => {
    loadChecks();
  }, []);

  async function loadChecks() {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('system_checks').select('*').order('sort_order', { ascending: true });
    if (error) {
      console.error(error);
      setChecks([]);
    } else {
      setChecks((data as SystemCheck[]) ?? []);
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('system_checks').update({ label: formData.label, active: formData.active, sort_order: formData.sort_order }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_checks').insert({ label: formData.label, active: formData.active, sort_order: formData.sort_order });
        if (error) throw error;
      }
      setFormData({ label: '', active: true, sort_order: checks.length });
      setShowForm(false);
      setEditingId(null);
      await loadChecks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c: SystemCheck) => {
    setFormData({ label: c.label, active: c.active, sort_order: c.sort_order ?? 0 });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this check?')) return;
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const { error } = await supabase.from('system_checks').delete().eq('id', id);
      if (error) throw error;
      await loadChecks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Checks</h2>
          <p className="text-sm text-gray-600 mt-1">
            Checklist items in the System Checks step. Technicians respond Yes/No/N/A for each.
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({ label: '', active: true, sort_order: checks.length }); setShowForm(true); }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm"
        >
          + Add Check
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold mb-4">{editingId ? 'Edit Check' : 'Add Check'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input type="text" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. All appliances properly covered..." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">{editingId ? 'Update' : 'Add'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : checks.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No checklist items yet.</td></tr>
            ) : (
              checks.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{c.sort_order ?? 0}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{c.label}</td>
                  <td className="px-6 py-4">{c.active ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(c)} className="text-red-600 hover:text-red-800 mr-4 text-sm">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-gray-600 hover:text-gray-800 text-sm">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvoiceItemsSection() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, active: true, sort_order: '' as string | number });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.error(error);
      setItems([]);
    } else {
      setItems((data as InvoiceItem[]) ?? []);
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    const description = formData.description.trim();
    const price = formData.price;
    if (!name) {
      alert('Item Name is required.');
      return;
    }
    if (!description) {
      alert('Description is required.');
      return;
    }
    if (price === undefined || price === null || isNaN(price) || price < 0) {
      alert('Price is required and must be 0 or greater.');
      return;
    }
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const sortOrder = formData.sort_order === '' || formData.sort_order === null ? null : (typeof formData.sort_order === 'number' ? formData.sort_order : parseInt(String(formData.sort_order), 10) || null);
      const payload = {
        name,
        description,
        price,
        active: formData.active,
        sort_order: sortOrder,
      };
      if (editingId) {
        const { error } = await supabase
          .from('invoice_items')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('invoice_items').insert(payload);
        if (error) throw error;
      }
      setFormData({ name: '', description: '', price: 0, active: true, sort_order: '' });
      setShowForm(false);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InvoiceItem) => {
    setFormData({
      name: item.name ?? '',
      description: item.description,
      price: item.price,
      active: item.active,
      sort_order: item.sort_order != null ? item.sort_order : '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item? It will no longer appear in the invoice item list.')) return;
    const supabase = createSupabaseClient();
    setLoading(true);
    try {
      const { error } = await supabase.from('invoice_items').delete().eq('id', id);
      if (error) throw error;
      await loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
          <p className="text-sm text-gray-600 mt-1">
            Items for invoice line items. When adding an invoice in the app, users pick from this list. Price and description are auto-filled but editable.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', price: 0, active: true, sort_order: '' });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm"
        >
          + Add Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold mb-4">{editingId ? 'Edit Item' : 'Add Item'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g. Fire Extinguisher Inspection"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g. Annual inspection of fire extinguishers"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price === 0 ? 0 : (formData.price || '')}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No invoice items yet. Add items above.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{item.description}</td>
                  <td className="px-6 py-4 text-gray-600">${Number(item.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">{item.active ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 text-gray-600">{item.sort_order != null ? item.sort_order : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(item)} className="text-red-600 hover:text-red-800 mr-4 text-sm">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-gray-800 text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
