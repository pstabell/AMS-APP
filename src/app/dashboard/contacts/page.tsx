"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Carrier } from "@/lib/carriers";
import type { MGA } from "@/lib/mgas";
import type { AgentContact } from "@/lib/agents";

type TabId = "carriers" | "mgas" | "agents";

const tabs = [
  { id: "carriers", label: "Carriers" },
  { id: "mgas", label: "MGAs" },
  { id: "agents", label: "Agents 📇" },
] as const;

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
        onKeyDown={(event) => event.key === "Escape" && onClose()}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--background)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
            aria-label="Close modal"
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

const Footer = () => (
  <footer className="mt-12 border-t-2 border-[var(--border-color)] bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background)] py-8 text-center">
    <div className="flex items-center justify-center gap-2 mb-3">
      <span className="text-2xl">🏢</span>
      <p className="font-bold text-[var(--accent-primary)]">Metro Point Technology</p>
    </div>
    <p className="text-xs text-[var(--foreground-muted)] mb-2">
      <a href="/terms" className="underline hover:text-[var(--accent-primary)] transition-colors">Terms of Service</a> |{' '}
      <a href="/privacy" className="underline hover:text-[var(--accent-primary)] transition-colors">Privacy Policy</a> |{' '}
      © 2026 All rights reserved
    </p>
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm">®</span>
      <p className="text-xs text-[var(--foreground-subtle)]">Metro Point is a registered trademark</p>
    </div>
  </footer>
);

export default function ContactsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("carriers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [mgas, setMgas] = useState<MGA[]>([]);
  const [agents, setAgents] = useState<AgentContact[]>([]);

  const [carrierModalOpen, setCarrierModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [carrierForm, setCarrierForm] = useState({
    name: "",
    code: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });

  const [mgaModalOpen, setMgaModalOpen] = useState(false);
  const [editingMga, setEditingMga] = useState<MGA | null>(null);
  const [mgaForm, setMgaForm] = useState({
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });

  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentContact | null>(null);
  const [agentForm, setAgentForm] = useState({
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });

  const buildHeaders = (): HeadersInit => {
    if (user?.email) {
      return { "x-user-email": user.email };
    }
    return {};
  };

  const fetchTabData = useCallback(
    async (tab: TabId) => {
      setLoading(true);
      setError(null);

      try {
        const headers = buildHeaders();
        const response = await fetch(`/api/contacts/${tab}`, { headers });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load contacts.");
        }

        if (tab === "carriers") {
          setCarriers(payload.data ?? []);
        } else if (tab === "mgas") {
          setMgas(payload.data ?? []);
        } else {
          setAgents(payload.data ?? []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load contacts.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const openCarrierModal = (carrier?: Carrier) => {
    if (carrier) {
      setEditingCarrier(carrier);
      setCarrierForm({
        name: carrier.name ?? "",
        code: carrier.code ?? "",
        contact_name: carrier.contact_name ?? "",
        contact_phone: carrier.contact_phone ?? "",
        contact_email: carrier.contact_email ?? "",
      });
    } else {
      setEditingCarrier(null);
      setCarrierForm({
        name: "",
        code: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
      });
    }
    setCarrierModalOpen(true);
  };

  const openMgaModal = (mga?: MGA) => {
    if (mga) {
      setEditingMga(mga);
      setMgaForm({
        name: mga.name ?? "",
        contact_name: mga.contact_name ?? "",
        contact_phone: mga.contact_phone ?? "",
        contact_email: mga.contact_email ?? "",
      });
    } else {
      setEditingMga(null);
      setMgaForm({
        name: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
      });
    }
    setMgaModalOpen(true);
  };

  const openAgentModal = (agent?: AgentContact) => {
    if (agent) {
      setEditingAgent(agent);
      setAgentForm({
        name: agent.name ?? "",
        contact_name: agent.contact_name ?? "",
        contact_phone: agent.contact_phone ?? "",
        contact_email: agent.contact_email ?? "",
      });
    } else {
      setEditingAgent(null);
      setAgentForm({
        name: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
      });
    }
    setAgentModalOpen(true);
  };

  const handleSaveCarrier = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(buildHeaders() ?? {}),
      };
      const response = await fetch("/api/contacts/carriers", {
        method: editingCarrier ? "PUT" : "POST",
        headers,
        body: JSON.stringify(
          editingCarrier
            ? { id: editingCarrier.id, ...carrierForm }
            : carrierForm
        ),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save carrier.");
      }

      setSuccess(editingCarrier ? "Carrier updated." : "Carrier added.");
      setCarrierModalOpen(false);
      fetchTabData("carriers");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save carrier.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMga = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(buildHeaders() ?? {}),
      };
      const response = await fetch("/api/contacts/mgas", {
        method: editingMga ? "PUT" : "POST",
        headers,
        body: JSON.stringify(
          editingMga ? { id: editingMga.id, ...mgaForm } : mgaForm
        ),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save MGA.");
      }

      setSuccess(editingMga ? "MGA updated." : "MGA added.");
      setMgaModalOpen(false);
      fetchTabData("mgas");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save MGA.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgent = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(buildHeaders() ?? {}),
      };
      const response = await fetch("/api/contacts/agents", {
        method: editingAgent ? "PUT" : "POST",
        headers,
        body: JSON.stringify(
          editingAgent ? { id: editingAgent.id, ...agentForm } : agentForm
        ),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save agent.");
      }

      setSuccess(editingAgent ? "Agent updated." : "Agent added.");
      setAgentModalOpen(false);
      fetchTabData("agents");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save agent.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: TabId, id: string) => {
    if (!confirm("Delete this contact?")) return;
    setLoading(true);
    setError(null);

    try {
      const headers = buildHeaders();
      const response = await fetch(`/api/contacts/${type}?id=${id}`, {
        method: "DELETE",
        headers,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete contact.");
      }

      setSuccess("Contact removed.");
      fetchTabData(type);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete contact.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyState = (label: string) => (
    <div className="text-center py-8 text-[var(--foreground-muted)]">
      <p>No {label.toLowerCase()} saved yet.</p>
      <p className="mt-1 text-sm">Add a contact to keep your directory up to date.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-lg">
          <span className="text-3xl">👥</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">Carriers & MGAs</h2>
          <p className="text-[var(--foreground-muted)] flex items-center gap-2">
            <span className="text-lg">🏢</span>
            Manage your carrier and MGA relationships
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-[var(--error-red)] bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] px-6 py-4 text-sm text-[var(--error-red)] shadow-lg flex items-center gap-3">
          <span className="text-xl">❌</span>
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-xs opacity-80">{error}</p>
            <button type="button" onClick={() => setError(null)} className="ml-2 font-medium underline hover:text-[var(--foreground)]">
              Dismiss
            </button>
          </div>
        </div>
      )}
      {success && (
        <div className="rounded-2xl border-2 border-[var(--success-green)] bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] px-6 py-4 text-sm text-[var(--success-green)] shadow-lg flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold">Success</p>
            <p className="text-xs opacity-80">{success}</p>
          </div>
        </div>
      )}

      {/* Global Search */}
      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
            <span className="text-xl">🔍</span>
          </div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">Search All Contacts</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              placeholder="Search across all contacts (name, company, email, phone)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b-2 border-[var(--border-color)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-4 px-6 py-3 text-sm font-bold transition-all rounded-t-xl ${
              activeTab === tab.id
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--background-secondary)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent-secondary)] hover:bg-[var(--background)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "carriers" && (
        <div className="card">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-md">
              <span className="text-xl">🏢</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--foreground)]">Carriers</h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Store carrier contact details and primary points of contact.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCarrierModal()}
              className="btn-primary flex items-center gap-2"
            >
              <span className="text-lg">➕</span>
              Add Carrier
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-[var(--foreground-muted)]">Loading carriers...</div>
          ) : carriers.length === 0 ? (
            renderEmptyState("Carriers")
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--background-tertiary)] border-b-2 border-[var(--border-color-strong)] text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Name/Code</th>
                    <th className="px-3 py-2.5 font-semibold">Contact</th>
                    <th className="px-3 py-2.5 font-semibold">Phone</th>
                    <th className="px-3 py-2.5 font-semibold">Email</th>
                    <th className="px-3 py-2.5 font-semibold">Commission Stats</th>
                    <th className="px-3 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {carriers
                    .filter((carrier) => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        carrier.name.toLowerCase().includes(query) ||
                        (carrier.code && carrier.code.toLowerCase().includes(query)) ||
                        (carrier.contact_name && carrier.contact_name.toLowerCase().includes(query)) ||
                        (carrier.contact_email && carrier.contact_email.toLowerCase().includes(query)) ||
                        (carrier.contact_phone && carrier.contact_phone.toLowerCase().includes(query))
                      );
                    })
                    .map((carrier) => {
                    const contactName = carrier.contact_name || "-";
                    return (
                      <tr key={carrier.id} className="border-b border-[var(--border-color)]">
                        <td className="px-3 py-3 font-medium text-[var(--foreground)]">
                          <div>
                            <div className="font-semibold">{carrier.name}</div>
                            {carrier.code && (
                              <div className="text-xs text-[var(--accent-secondary)] font-medium">{carrier.code}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[var(--foreground-muted)]">{contactName}</td>
                        <td className="px-3 py-3 text-[var(--foreground-muted)]">
                          {carrier.contact_phone || "-"}
                        </td>
                        <td className="px-3 py-3 text-[var(--foreground-muted)]">
                          {carrier.contact_email || "-"}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs text-[var(--foreground-subtle)]">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                              <span>Active Policies: 0</span>
                            </div>
                            <div className="mt-1 text-amber-600">Avg Comm: 0%</div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => openCarrierModal(carrier)}
                            className="mr-2 text-amber-600 hover:text-amber-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete("carriers", carrier.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "mgas" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">MGAs</h3>
              <p className="text-sm text-slate-600">
                Track MGA contacts and their preferred communication channels.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openMgaModal()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add MGA
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading MGAs...</div>
          ) : mgas.length === 0 ? (
            renderEmptyState("MGAs")
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--background-tertiary)] border-b-2 border-[var(--border-color-strong)] text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Name</th>
                    <th className="px-3 py-2.5 font-semibold">Contact</th>
                    <th className="px-3 py-2.5 font-semibold">Phone</th>
                    <th className="px-3 py-2.5 font-semibold">Email</th>
                    <th className="px-3 py-2.5 font-semibold">Relationships</th>
                    <th className="px-3 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mgas
                    .filter((mga) => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        mga.name.toLowerCase().includes(query) ||
                        (mga.contact_name && mga.contact_name.toLowerCase().includes(query)) ||
                        (mga.contact_email && mga.contact_email.toLowerCase().includes(query)) ||
                        (mga.contact_phone && mga.contact_phone.toLowerCase().includes(query))
                      );
                    })
                    .map((mga) => (
                    <tr key={mga.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-900">{mga.name}</td>
                      <td className="px-3 py-3 text-slate-600">
                        {mga.contact_name || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {mga.contact_phone || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {mga.contact_email || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
                            <span>Active Policies: 0</span>
                          </div>
                          <div className="mt-1 text-blue-600">Commission Rules: 0</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openMgaModal(mga)}
                          className="mr-2 text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete("mgas", mga.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
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

      {activeTab === "agents" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Agents</h3>
              <p className="text-sm text-slate-600">
                Keep agent contact information current for commission follow-ups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAgentModal()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add Agent
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading agents...</div>
          ) : agents.length === 0 ? (
            renderEmptyState("Agents")
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--background-tertiary)] border-b-2 border-[var(--border-color-strong)] text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Name</th>
                    <th className="px-3 py-2.5 font-semibold">Contact</th>
                    <th className="px-3 py-2.5 font-semibold">Phone</th>
                    <th className="px-3 py-2.5 font-semibold">Email</th>
                    <th className="px-3 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents
                    .filter((agent) => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        agent.name.toLowerCase().includes(query) ||
                        (agent.contact_name && agent.contact_name.toLowerCase().includes(query)) ||
                        (agent.contact_email && agent.contact_email.toLowerCase().includes(query)) ||
                        (agent.contact_phone && agent.contact_phone.toLowerCase().includes(query))
                      );
                    })
                    .map((agent) => (
                    <tr key={agent.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {agent.name}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {agent.contact_name || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {agent.contact_phone || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {agent.contact_email || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openAgentModal(agent)}
                          className="mr-2 text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete("agents", agent.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
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
                onChange={(event) =>
                  setCarrierForm({ ...carrierForm, name: event.target.value })
                }
                placeholder="State Farm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Code *</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={carrierForm.code}
                onChange={(event) =>
                  setCarrierForm({ ...carrierForm, code: event.target.value.toUpperCase() })
                }
                placeholder="STFM"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Contact</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={carrierForm.contact_name}
              onChange={(event) =>
                setCarrierForm({ ...carrierForm, contact_name: event.target.value })
              }
              placeholder="Primary contact"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={carrierForm.contact_phone}
                onChange={(event) =>
                  setCarrierForm({ ...carrierForm, contact_phone: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={carrierForm.contact_email}
                onChange={(event) =>
                  setCarrierForm({ ...carrierForm, contact_email: event.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
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

      <Modal
        isOpen={mgaModalOpen}
        onClose={() => setMgaModalOpen(false)}
        title={editingMga ? "Edit MGA" : "Add MGA"}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Name *</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={mgaForm.name}
              onChange={(event) =>
                setMgaForm({ ...mgaForm, name: event.target.value })
              }
              placeholder="MGA Name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Contact</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={mgaForm.contact_name}
              onChange={(event) =>
                setMgaForm({ ...mgaForm, contact_name: event.target.value })
              }
              placeholder="Primary contact"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={mgaForm.contact_phone}
                onChange={(event) =>
                  setMgaForm({ ...mgaForm, contact_phone: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={mgaForm.contact_email}
                onChange={(event) =>
                  setMgaForm({ ...mgaForm, contact_email: event.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setMgaModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveMga}
              disabled={loading || !mgaForm.name}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
        title={editingAgent ? "Edit Agent" : "Add Agent"}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Name *</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={agentForm.name}
              onChange={(event) =>
                setAgentForm({ ...agentForm, name: event.target.value })
              }
              placeholder="Agent name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Contact</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={agentForm.contact_name}
              onChange={(event) =>
                setAgentForm({ ...agentForm, contact_name: event.target.value })
              }
              placeholder="Primary contact"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={agentForm.contact_phone}
                onChange={(event) =>
                  setAgentForm({ ...agentForm, contact_phone: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={agentForm.contact_email}
                onChange={(event) =>
                  setAgentForm({ ...agentForm, contact_email: event.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setAgentModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAgent}
              disabled={loading || !agentForm.name}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
