"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Carrier } from "@/lib/carriers";
import type { CommissionRule } from "@/lib/commission-rules";
import type { ColumnMapping } from "@/lib/column-mappings";
import { POLICY_FIELDS, DEFAULT_COLUMN_MAPPING } from "@/lib/column-mappings";
import { TRANSACTION_TYPES } from "@/lib/calculations";

type AdminUser = {
  id: string;
  email: string;
  role?: string | null;
  subscription_status?: string | null;
  password_set?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const ROLE_OPTIONS = ["agent", "manager", "admin", "owner", "operations"];
const SUBSCRIPTION_STATUS_OPTIONS = ["active", "inactive", "past_due", "canceled"];

// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--background-secondary)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--border-radius-large)] p-1 text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("settings");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState({
    email_notifications: true,
    default_date_range: "month",
    default_page_size: 25,
    currency_format: "USD",
    date_format: "MM/DD/YYYY",
    timezone: "America/New_York",
    theme: "light",
  });
  const [settingsOptions, setSettingsOptions] = useState<any>(null);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [supportsRoles, setSupportsRoles] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    email: "",
    role: "agent",
    subscription_status: "inactive",
    password: "",
  });

  // Carriers State
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [carrierModalOpen, setCarrierModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [carrierForm, setCarrierForm] = useState({
    name: "",
    code: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    notes: "",
    active: true,
  });

  // Commission Rules State
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [rulesAreDefault, setRulesAreDefault] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    transaction_type: "NEW",
    description: "",
    agent_rate: 50,
    notes: "",
    active: true,
  });

  // Column Mappings State
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ColumnMapping | null>(null);
  const [mappingForm, setMappingForm] = useState({
    name: "",
    carrier_id: "",
    carrier_name: "",
    mappings: { ...DEFAULT_COLUMN_MAPPING },
    is_default: false,
    notes: "",
    active: true,
  });

  const tabs = [
    { id: "settings", label: "User Settings" },
    { id: "users", label: "Users" },
    { id: "carriers", label: "Carrier Management" },
    { id: "commission-rules", label: "Commission Rules" },
    { id: "column-mapping", label: "Column Mappings" },
  ];

  // Fetch data based on active tab
  const fetchData = useCallback(async (tab: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const headers = { "x-user-id": user.id };
      
      switch (tab) {
        case "settings": {
          const res = await fetch("/api/admin/settings", { headers });
          const json = await res.json();
          if (json.data) setSettings(json.data);
          if (json.options) setSettingsOptions(json.options);
          break;
        }
        case "users": {
          const res = await fetch("/api/admin/users", { headers });
          const json = await res.json();
          if (json.data) {
            setUsers(json.data);
            if (json.data.length > 0) {
              setSupportsRoles(Object.prototype.hasOwnProperty.call(json.data[0], "role"));
            }
          }
          break;
        }
        case "carriers": {
          const res = await fetch("/api/admin/carriers", { headers });
          const json = await res.json();
          if (json.data) setCarriers(json.data);
          break;
        }
        case "commission-rules": {
          const res = await fetch("/api/admin/commission-rules", { headers });
          const json = await res.json();
          if (json.data) setCommissionRules(json.data);
          setRulesAreDefault(json.isDefault ?? false);
          break;
        }
        case "column-mapping": {
          const res = await fetch("/api/admin/column-mappings", { headers });
          const json = await res.json();
          if (json.data) setColumnMappings(json.data);
          if (carriers.length === 0) {
            const carrierRes = await fetch("/api/admin/carriers", { headers });
            const carrierJson = await carrierRes.json();
            if (carrierJson.data) setCarriers(carrierJson.data);
          }
          break;
        }
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user?.id, carriers.length]);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Settings handlers
  const handleSaveSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id 
        },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        setSuccess("Settings saved successfully");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to save settings");
      }
    } catch {
      setError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // User handlers
  const openUserModal = (targetUser?: AdminUser) => {
    if (targetUser) {
      setEditingUser(targetUser);
      setUserForm({
        email: targetUser.email || "",
        role: targetUser.role || "agent",
        subscription_status: targetUser.subscription_status || "inactive",
        password: "",
      });
    } else {
      setEditingUser(null);
      setUserForm({
        email: "",
        role: "agent",
        subscription_status: "inactive",
        password: "",
      });
    }
    setUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const method = editingUser ? "PUT" : "POST";
      const body: any = editingUser
        ? { id: editingUser.id, ...userForm }
        : { ...userForm };

      if (!supportsRoles) {
        delete body.role;
      }
      if (!body.password) {
        delete body.password;
      }

      const res = await fetch("/api/admin/users", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess(editingUser ? "User updated" : "User created");
        setUserModalOpen(false);
        fetchData("users");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to save user");
      }
    } catch {
      setError("Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!user?.id || !confirm("Delete this user?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });

      if (res.ok) {
        setSuccess("User deleted");
        fetchData("users");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to delete user");
      }
    } catch {
      setError("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // Carrier handlers
  const openCarrierModal = (carrier?: Carrier) => {
    if (carrier) {
      setEditingCarrier(carrier);
      setCarrierForm({
        name: carrier.name,
        code: carrier.code,
        contact_name: carrier.contact_name || "",
        contact_email: carrier.contact_email || "",
        contact_phone: carrier.contact_phone || "",
        website: carrier.website || "",
        notes: carrier.notes || "",
        active: carrier.active,
      });
    } else {
      setEditingCarrier(null);
      setCarrierForm({
        name: "",
        code: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        website: "",
        notes: "",
        active: true,
      });
    }
    setCarrierModalOpen(true);
  };

  const handleSaveCarrier = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const method = editingCarrier ? "PUT" : "POST";
      const body = editingCarrier 
        ? { id: editingCarrier.id, ...carrierForm }
        : carrierForm;
      
      const res = await fetch("/api/admin/carriers", {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id 
        },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        setSuccess(editingCarrier ? "Carrier updated" : "Carrier created");
        setCarrierModalOpen(false);
        fetchData("carriers");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to save carrier");
      }
    } catch {
      setError("Failed to save carrier");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCarrier = async (id: string) => {
    if (!user?.id || !confirm("Delete this carrier?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/carriers?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });
      
      if (res.ok) {
        setSuccess("Carrier deleted");
        fetchData("carriers");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to delete carrier");
      }
    } catch {
      setError("Failed to delete carrier");
    } finally {
      setLoading(false);
    }
  };

  // Commission Rule handlers
  const openRuleModal = (rule?: CommissionRule) => {
    if (rule && !rule.id.startsWith("default-")) {
      setEditingRule(rule);
      setRuleForm({
        transaction_type: rule.transaction_type,
        description: rule.description,
        agent_rate: rule.agent_rate,
        notes: rule.notes || "",
        active: rule.active,
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        transaction_type: "NEW",
        description: "",
        agent_rate: 50,
        notes: "",
        active: true,
      });
    }
    setRuleModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const method = editingRule ? "PUT" : "POST";
      const body = editingRule 
        ? { id: editingRule.id, ...ruleForm }
        : ruleForm;
      
      const res = await fetch("/api/admin/commission-rules", {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id 
        },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        setSuccess(editingRule ? "Rule updated" : "Rule created");
        setRuleModalOpen(false);
        fetchData("commission-rules");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to save rule");
      }
    } catch {
      setError("Failed to save rule");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaultRules = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/commission-rules", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id 
        },
        body: JSON.stringify({ seedDefaults: true }),
      });
      
      if (res.ok) {
        setSuccess("Default rules created");
        fetchData("commission-rules");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to seed rules");
      }
    } catch {
      setError("Failed to seed rules");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!user?.id || id.startsWith("default-") || !confirm("Delete this rule?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/commission-rules?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });
      
      if (res.ok) {
        setSuccess("Rule deleted");
        fetchData("commission-rules");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to delete rule");
      }
    } catch {
      setError("Failed to delete rule");
    } finally {
      setLoading(false);
    }
  };

  // Column Mapping handlers
  const openMappingModal = (mapping?: ColumnMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      setMappingForm({
        name: mapping.name,
        carrier_id: mapping.carrier_id || "",
        carrier_name: mapping.carrier_name || "",
        mappings: mapping.mappings || { ...DEFAULT_COLUMN_MAPPING },
        is_default: mapping.is_default,
        notes: mapping.notes || "",
        active: mapping.active,
      });
    } else {
      setEditingMapping(null);
      setMappingForm({
        name: "",
        carrier_id: "",
        carrier_name: "",
        mappings: { ...DEFAULT_COLUMN_MAPPING },
        is_default: false,
        notes: "",
        active: true,
      });
    }
    setMappingModalOpen(true);
  };

  const handleSaveMapping = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const method = editingMapping ? "PUT" : "POST";
      const payload = {
        ...mappingForm,
        carrier_id: mappingForm.carrier_id || null,
        carrier_name: mappingForm.carrier_name || null,
      };
      const body = editingMapping 
        ? { id: editingMapping.id, ...payload }
        : payload;
      
      const res = await fetch("/api/admin/column-mappings", {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id 
        },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        setSuccess(editingMapping ? "Mapping updated" : "Mapping created");
        setMappingModalOpen(false);
        fetchData("column-mapping");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to save mapping");
      }
    } catch {
      setError("Failed to save mapping");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!user?.id || !confirm("Delete this mapping?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/column-mappings?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });
      
      if (res.ok) {
        setSuccess("Mapping deleted");
        fetchData("column-mapping");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to delete mapping");
      }
    } catch {
      setError("Failed to delete mapping");
    } finally {
      setLoading(false);
    }
  };

  const formatShortDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const carrierActiveCount = carriers.filter((carrier) => carrier.active).length;
  const carrierInactiveCount = carriers.length - carrierActiveCount;
  const activeRulesCount = commissionRules.filter((rule) => rule.active).length;
  const defaultMappingsCount = columnMappings.filter((mapping) => mapping.is_default).length;
  const countMappedFields = (mapping: ColumnMapping) =>
    Object.values(mapping.mappings || {}).filter((value) => Boolean(value)).length;
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? "section";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">⚙️ Admin Panel</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          Manage app settings, configuration, and system data.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-[var(--border-radius-large)] border border-[var(--error-red)] bg-[var(--error-red)] px-4 py-3 text-sm text-white">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 font-medium underline">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="rounded-[var(--border-radius-large)] border border-[var(--success-green)] bg-[var(--success-green)] px-4 py-3 text-sm text-white">
          {success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-4 shadow-lg">
          <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">Carriers</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{carriers.length}</p>
          <p className="text-xs text-slate-500">
            {carrierActiveCount} active · {carrierInactiveCount} inactive
          </p>
        </div>
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-4 shadow-lg">
          <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">Commission Rules</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{commissionRules.length}</p>
          <p className="text-xs text-[var(--foreground-muted)]">{activeRulesCount} active</p>
        </div>
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-4 shadow-lg">
          <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">Column Mappings</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{columnMappings.length}</p>
          <p className="text-xs text-[var(--foreground-muted)]">{defaultMappingsCount} default</p>
        </div>
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-4 shadow-lg">
          <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">Users</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{users.length}</p>
          <p className="text-xs text-slate-500">Active subscriptions visible</p>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          Loading {activeTabLabel.toLowerCase()}...
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-5 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
                <span className="text-xl">👤</span>
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">Account Information</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  value={user?.email ?? ""}
                  disabled
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">User ID</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  value={user?.id ?? ""}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-5 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
                <span className="text-xl">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">User Preferences</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Default Date Range</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.default_date_range}
                  onChange={(e) => setSettings({ ...settings, default_date_range: e.target.value })}
                >
                  {settingsOptions?.dateRanges?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  )) || (
                    <>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="quarter">Last 90 Days</option>
                      <option value="year">Last Year</option>
                      <option value="all">All Time</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Results Per Page</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.default_page_size}
                  onChange={(e) => setSettings({ ...settings, default_page_size: Number(e.target.value) })}
                >
                  {(settingsOptions?.pageSizes || [10, 25, 50, 100]).map((size: number) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Currency Format</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.currency_format}
                  onChange={(e) => setSettings({ ...settings, currency_format: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="CAD">CAD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Date Format</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.date_format}
                  onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                >
                  {settingsOptions?.dateFormats?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  )) || (
                    <>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Timezone</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                >
                  {settingsOptions?.timezones?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  )) || (
                    <>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="UTC">UTC</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Theme</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  id="email_notifications"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={settings.email_notifications}
                  onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                />
                <label htmlFor="email_notifications" className="text-sm text-slate-700">
                  Receive email notifications for commission updates
                </label>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={loading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
              <p className="text-sm text-slate-600">
                Create users and manage subscription status{supportsRoles ? " and roles" : ""}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openUserModal()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add User
            </button>
          </div>

          {users.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p>No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Email</th>
                    {supportsRoles && <th className="px-3 py-2">Role</th>}
                    <th className="px-3 py-2">Subscription</th>
                    <th className="px-3 py-2">Password Set</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-900">{u.email}</td>
                      {supportsRoles && (
                        <td className="px-3 py-3 text-slate-600">
                          {u.role ? u.role : "-"}
                        </td>
                      )}
                      <td className="px-3 py-3 text-slate-600">
                        {u.subscription_status || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {u.password_set ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatShortDate(u.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openUserModal(u)}
                          className="mr-2 text-slate-600 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Carriers Tab */}
      {activeTab === "carriers" && (
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Carrier Management</h3>
              <p className="text-sm text-slate-600">
                Maintain carrier records used for policy and statement tracking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCarrierModal()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add Carrier
            </button>
          </div>
          
          {carriers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No carriers configured yet.</p>
              <p className="text-sm mt-1">Add carriers to track commissions by insurance company.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Contact</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {carriers.map((carrier) => (
                    <tr key={carrier.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium">{carrier.name}</td>
                      <td className="px-3 py-3 text-slate-600">{carrier.code}</td>
                      <td className="px-3 py-3">
                        <div className="text-slate-700">
                          {carrier.contact_name || carrier.contact_email || "-"}
                        </div>
                        {carrier.contact_name && carrier.contact_email && (
                          <div className="text-xs text-slate-500">{carrier.contact_email}</div>
                        )}
                        {carrier.contact_phone && (
                          <div className="text-xs text-slate-500">{carrier.contact_phone}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          carrier.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {carrier.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openCarrierModal(carrier)}
                          className="mr-2 text-slate-600 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCarrier(carrier.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Commission Rules Tab */}
      {activeTab === "commission-rules" && (
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Commission Rules</h3>
            <div className="flex gap-2">
              {rulesAreDefault && (
                <button
                  type="button"
                  onClick={handleSeedDefaultRules}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Save Defaults
                </button>
              )}
              <button
                type="button"
                onClick={() => openRuleModal()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Rule
              </button>
            </div>
          </div>

          {rulesAreDefault && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              These are default rules. Click "Save Defaults" to customize them.
            </div>
          )}

          {commissionRules.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No commission rules configured yet.</p>
              <p className="text-sm mt-1">Add rules to control agent commission rates by transaction type.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Transaction Type</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Agent Rate</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Notes</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionRules.map((rule) => (
                    <tr key={rule.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium">{rule.transaction_type}</td>
                      <td className="px-3 py-3 text-slate-600">{rule.description}</td>
                      <td className="px-3 py-3 text-slate-600">{rule.agent_rate}%</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          rule.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {rule.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 text-xs">{rule.notes || "-"}</td>
                      <td className="px-3 py-3">
                        {!rule.id.startsWith("default-") ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openRuleModal(rule)}
                              className="mr-2 text-slate-600 hover:text-slate-900"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs">Default</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Column Mapping Tab */}
      {activeTab === "column-mapping" && (
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Column Mappings</h3>
              <p className="text-sm text-slate-600">
                Configure how imported CSV/Excel columns map to policy fields.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openMappingModal()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add Mapping
            </button>
          </div>
          
          {columnMappings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No column mappings configured yet.</p>
              <p className="text-sm mt-1">Create mappings to import commission statements from different carriers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Carrier</th>
                    <th className="px-3 py-2">Mapped Fields</th>
                    <th className="px-3 py-2">Default</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {columnMappings.map((mapping) => (
                    <tr key={mapping.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium">{mapping.name}</td>
                      <td className="px-3 py-3 text-slate-600">{mapping.carrier_name || "Any"}</td>
                      <td className="px-3 py-3 text-slate-600">
                        {countMappedFields(mapping)} / {POLICY_FIELDS.length}
                      </td>
                      <td className="px-3 py-3">
                        {mapping.is_default && (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          mapping.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {mapping.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openMappingModal(mapping)}
                          className="mr-2 text-slate-600 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMapping(mapping.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* User Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? "Edit User" : "Add User"}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email *</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="agent@example.com"
            />
          </div>

          {supportsRoles && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Subscription Status</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={userForm.subscription_status}
              onChange={(e) =>
                setUserForm({ ...userForm, subscription_status: e.target.value })
              }
            >
              {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              {editingUser ? "Reset Password (optional)" : "Password *"}
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder={editingUser ? "Leave blank to keep current" : "Set a temporary password"}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setUserModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveUser}
              disabled={loading || !userForm.email || (!editingUser && !userForm.password)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Carrier Modal */}
      <Modal
        isOpen={carrierModalOpen}
        onClose={() => setCarrierModalOpen(false)}
        title={editingCarrier ? "Edit Carrier" : "Add Carrier"}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Name *</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={carrierForm.name}
                onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                placeholder="State Farm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Code *</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={carrierForm.code}
                onChange={(e) => setCarrierForm({ ...carrierForm, code: e.target.value.toUpperCase() })}
                placeholder="STFM"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Contact Name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={carrierForm.contact_name}
              onChange={(e) => setCarrierForm({ ...carrierForm, contact_name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Contact Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={carrierForm.contact_email}
              onChange={(e) => setCarrierForm({ ...carrierForm, contact_email: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Contact Phone</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={carrierForm.contact_phone}
              onChange={(e) => setCarrierForm({ ...carrierForm, contact_phone: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Website</label>
            <input
              type="url"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={carrierForm.website}
              onChange={(e) => setCarrierForm({ ...carrierForm, website: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={2}
              value={carrierForm.notes}
              onChange={(e) => setCarrierForm({ ...carrierForm, notes: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="carrier_active"
              className="h-4 w-4 rounded border-slate-300"
              checked={carrierForm.active}
              onChange={(e) => setCarrierForm({ ...carrierForm, active: e.target.checked })}
            />
            <label htmlFor="carrier_active" className="text-sm text-slate-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCarrierModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCarrier}
              disabled={loading || !carrierForm.name || !carrierForm.code}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Commission Rule Modal */}
      <Modal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title={editingRule ? "Edit Commission Rule" : "Add Commission Rule"}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Transaction Type *</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={ruleForm.transaction_type}
              onChange={(e) => setRuleForm({ ...ruleForm, transaction_type: e.target.value })}
            >
              {TRANSACTION_TYPES.map((tt) => (
                <option key={tt.code} value={tt.code}>
                  {tt.code} - {tt.description}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Description *</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={ruleForm.description}
              onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              placeholder="New Business"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Agent Rate (%) *</label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={ruleForm.agent_rate}
              onChange={(e) => setRuleForm({ ...ruleForm, agent_rate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={2}
              value={ruleForm.notes}
              onChange={(e) => setRuleForm({ ...ruleForm, notes: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rule_active"
              className="h-4 w-4 rounded border-slate-300"
              checked={ruleForm.active}
              onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })}
            />
            <label htmlFor="rule_active" className="text-sm text-slate-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setRuleModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRule}
              disabled={loading || !ruleForm.transaction_type || !ruleForm.description}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Column Mapping Modal */}
      <Modal
        isOpen={mappingModalOpen}
        onClose={() => setMappingModalOpen(false)}
        title={editingMapping ? "Edit Column Mapping" : "Add Column Mapping"}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Mapping Name *</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={mappingForm.name}
                onChange={(e) => setMappingForm({ ...mappingForm, name: e.target.value })}
                placeholder="Standard Import"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Carrier (optional)</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={mappingForm.carrier_name}
                list="carrier-options"
                onChange={(e) => {
                  const value = e.target.value;
                  const match = carriers.find(
                    (carrier) => carrier.name.toLowerCase() === value.toLowerCase()
                  );
                  setMappingForm({
                    ...mappingForm,
                    carrier_name: value,
                    carrier_id: match ? match.id : "",
                  });
                }}
                placeholder="All carriers"
              />
              <datalist id="carrier-options">
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.name} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500">
                Start typing to select an existing carrier, or leave blank for any carrier.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Column Mappings</label>
            <p className="text-xs text-slate-500">
              Enter the column header names from your import file that correspond to each field.
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
              {POLICY_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <label className="w-32 text-xs font-medium text-slate-600">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
                    value={mappingForm.mappings[field.key] || ""}
                    onChange={(e) => setMappingForm({
                      ...mappingForm,
                      mappings: { ...mappingForm.mappings, [field.key]: e.target.value }
                    })}
                    placeholder={DEFAULT_COLUMN_MAPPING[field.key]}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={2}
              value={mappingForm.notes}
              onChange={(e) => setMappingForm({ ...mappingForm, notes: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mapping_default"
                className="h-4 w-4 rounded border-slate-300"
                checked={mappingForm.is_default}
                onChange={(e) => setMappingForm({ ...mappingForm, is_default: e.target.checked })}
              />
              <label htmlFor="mapping_default" className="text-sm text-slate-700">Default mapping</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mapping_active"
                className="h-4 w-4 rounded border-slate-300"
                checked={mappingForm.active}
                onChange={(e) => setMappingForm({ ...mappingForm, active: e.target.checked })}
              />
              <label htmlFor="mapping_active" className="text-sm text-slate-700">Active</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setMappingModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveMapping}
              disabled={loading || !mappingForm.name}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Professional Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-4">
        <div className="mx-auto max-w-md text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <a href="/terms" className="hover:text-slate-700">Terms of Service</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-slate-700">Privacy Policy</a>
          </div>
          <p className="mt-2">© 2025 Metro Technology Solutions LLC. All rights reserved.</p>
          <p className="mt-1">AMS Dash App™ is a trademark of Metro Technology Solutions LLC.</p>
        </div>
      </footer>
    </div>
  );
}
