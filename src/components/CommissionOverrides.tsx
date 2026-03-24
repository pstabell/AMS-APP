"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/calculations";

type CommissionOverride = {
  id: string;
  policy_id: string;
  agent_id: string | null;
  original_rate: number;
  override_rate: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  policy?: { policy_number: string; customer: string; };
  agent?: { first_name: string; last_name: string; };
  created_by_user?: { email: string; };
  approved_by_user?: { email: string; };
};

type AgentCommissionOverride = {
  id: string;
  agent_id: string;
  transaction_type: string;
  carrier_id: string | null;
  mga_name: string | null;
  override_rate: number;
  effective_from: string;
  effective_to: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  agent?: { first_name: string; last_name: string; email: string; };
  carrier?: { name: string; code: string; };
  created_by_user?: { email: string; };
  approved_by_user?: { email: string; };
};

type Agent = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Carrier = {
  id: string;
  name: string;
  code: string;
};

type Policy = {
  id: string;
  policy_number: string;
  customer: string;
  agent_id?: string;
  carrier_id?: string;
};

type CommissionOverridesProps = {
  policyId?: string; // If provided, show only overrides for this policy
  agentId?: string;  // If provided, filter by this agent
  className?: string;
};

const TRANSACTION_TYPES = [
  'NEW', 'NBS', 'RWL', 'END', 'PCH', 'CAN', 'XCL', 'STL', 'BoR', 'REWRITE'
];

export default function CommissionOverrides({
  policyId,
  agentId,
  className = ""
}: CommissionOverridesProps) {
  const { user } = useAuth();

  // Tab Management
  const [activeTab, setActiveTab] = useState<'policy' | 'agent'>('policy');

  // Policy Overrides State
  const [policyOverrides, setPolicyOverrides] = useState<CommissionOverride[]>([]);
  const [policyOverridesLoading, setPolicyOverridesLoading] = useState(false);
  const [policyOverridesError, setPolicyOverridesError] = useState<string | null>(null);

  // Agent Overrides State
  const [agentOverrides, setAgentOverrides] = useState<AgentCommissionOverride[]>([]);
  const [agentOverridesLoading, setAgentOverridesLoading] = useState(false);
  const [agentOverridesError, setAgentOverridesError] = useState<string | null>(null);

  // Form State
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [showAgentForm, setShowAgentForm] = useState(false);

  // Data for forms
  const [agents, setAgents] = useState<Agent[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  // Form Data
  const [policyFormData, setPolicyFormData] = useState({
    policy_id: policyId || '',
    agent_id: agentId || '',
    original_rate: '',
    override_rate: '',
    reason: ''
  });

  const [agentFormData, setAgentFormData] = useState({
    agent_id: agentId || '',
    transaction_type: '',
    carrier_id: '',
    mga_name: '',
    override_rate: '',
    effective_from: '',
    effective_to: '',
    reason: ''
  });

  // Load Policy Overrides
  const loadPolicyOverrides = useCallback(async () => {
    if (!user?.id) return;

    setPolicyOverridesLoading(true);
    setPolicyOverridesError(null);

    try {
      const params = new URLSearchParams();
      if (policyId) params.set('policy_id', policyId);
      
      const response = await fetch(`/api/admin/commission-overrides?${params.toString()}`, {
        headers: { 'x-user-id': user.id }
      });

      if (!response.ok) throw new Error('Failed to load overrides');

      const { data } = await response.json();
      setPolicyOverrides(data || []);
    } catch (error) {
      setPolicyOverridesError('Failed to load policy overrides');
      console.error('Policy overrides load error:', error);
    } finally {
      setPolicyOverridesLoading(false);
    }
  }, [user?.id, policyId]);

  // Load Agent Overrides
  const loadAgentOverrides = useCallback(async () => {
    if (!user?.id) return;

    setAgentOverridesLoading(true);
    setAgentOverridesError(null);

    try {
      const params = new URLSearchParams();
      if (agentId) params.set('agent_id', agentId);
      
      const response = await fetch(`/api/admin/agent-commission-overrides?${params.toString()}`, {
        headers: { 'x-user-id': user.id }
      });

      if (!response.ok) throw new Error('Failed to load agent overrides');

      const { data } = await response.json();
      setAgentOverrides(data || []);
    } catch (error) {
      setAgentOverridesError('Failed to load agent overrides');
      console.error('Agent overrides load error:', error);
    } finally {
      setAgentOverridesLoading(false);
    }
  }, [user?.id, agentId]);

  // Load reference data
  const loadReferenceData = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Load agents
      const agentsResponse = await fetch('/api/contacts/agents', {
        headers: { 'x-user-email': user.email }
      });
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setAgents(agentsData.data || []);
      }

      // Load carriers
      const carriersResponse = await fetch('/api/admin/carriers', {
        headers: { 'x-user-id': user.id }
      });
      if (carriersResponse.ok) {
        const carriersData = await carriersResponse.json();
        setCarriers(carriersData.data || []);
      }

      // Load policies if needed for policy form
      if (!policyId) {
        const policiesResponse = await fetch('/api/policies?limit=100', {
          headers: { 'x-user-email': user.email }
        });
        if (policiesResponse.ok) {
          const policiesData = await policiesResponse.json();
          setPolicies(policiesData.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  }, [user?.email, user?.id, policyId]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    if (activeTab === 'policy') {
      loadPolicyOverrides();
    } else {
      loadAgentOverrides();
    }
  }, [activeTab, loadPolicyOverrides, loadAgentOverrides]);

  // Handle Policy Override Form Submit
  const handlePolicyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const response = await fetch('/api/admin/commission-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          ...policyFormData,
          original_rate: parseFloat(policyFormData.original_rate),
          override_rate: parseFloat(policyFormData.override_rate)
        })
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      setShowPolicyForm(false);
      setPolicyFormData({
        policy_id: policyId || '',
        agent_id: agentId || '',
        original_rate: '',
        override_rate: '',
        reason: ''
      });
      loadPolicyOverrides();
    } catch (error) {
      alert(`Error creating override: ${error}`);
    }
  };

  // Handle Agent Override Form Submit
  const handleAgentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const payload = {
        ...agentFormData,
        override_rate: parseFloat(agentFormData.override_rate),
        carrier_id: agentFormData.carrier_id || null,
        mga_name: agentFormData.mga_name || null,
        effective_to: agentFormData.effective_to || null
      };

      const response = await fetch('/api/admin/agent-commission-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      setShowAgentForm(false);
      setAgentFormData({
        agent_id: agentId || '',
        transaction_type: '',
        carrier_id: '',
        mga_name: '',
        override_rate: '',
        effective_from: '',
        effective_to: '',
        reason: ''
      });
      loadAgentOverrides();
    } catch (error) {
      alert(`Error creating agent override: ${error}`);
    }
  };

  // Handle approval/rejection
  const handleStatusUpdate = async (
    type: 'policy' | 'agent',
    overrideId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) => {
    if (!user?.id) return;

    try {
      const url = type === 'policy' 
        ? '/api/admin/commission-overrides'
        : '/api/admin/agent-commission-overrides';

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          id: overrideId,
          status,
          rejection_reason: rejectionReason
        })
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      // Reload the appropriate overrides
      if (type === 'policy') {
        loadPolicyOverrides();
      } else {
        loadAgentOverrides();
      }
    } catch (error) {
      alert(`Error updating override: ${error}`);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Commission Overrides</h3>
          <p className="text-sm text-slate-600">Manage policy and agent-specific commission rate overrides</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('policy')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'policy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Policy Overrides
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'agent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Agent Overrides
          </button>
        </nav>
      </div>

      {/* Policy Overrides Tab */}
      {activeTab === 'policy' && (
        <div className="space-y-4">
          {/* Add Policy Override Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowPolicyForm(!showPolicyForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Add Policy Override
            </button>
          </div>

          {/* Policy Override Form */}
          {showPolicyForm && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-4">Create Policy Override</h4>
              <form onSubmit={handlePolicyFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!policyId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Policy</label>
                    <select
                      value={policyFormData.policy_id}
                      onChange={(e) => setPolicyFormData(prev => ({ ...prev, policy_id: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select Policy</option>
                      {policies.map((policy) => (
                        <option key={policy.id} value={policy.id}>
                          {policy.policy_number} - {policy.customer}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {!agentId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agent (Optional)</label>
                    <select
                      value={policyFormData.agent_id}
                      onChange={(e) => setPolicyFormData(prev => ({ ...prev, agent_id: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select Agent</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.first_name} {agent.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Original Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={policyFormData.original_rate}
                    onChange={(e) => setPolicyFormData(prev => ({ ...prev, original_rate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Override Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={policyFormData.override_rate}
                    onChange={(e) => setPolicyFormData(prev => ({ ...prev, override_rate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                  <textarea
                    value={policyFormData.reason}
                    onChange={(e) => setPolicyFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Create Override
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPolicyForm(false)}
                    className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Policy Overrides List */}
          <div className="bg-white rounded-lg border border-slate-200">
            {policyOverridesLoading ? (
              <div className="p-8 text-center text-slate-500">Loading policy overrides...</div>
            ) : policyOverridesError ? (
              <div className="p-8 text-center text-red-600">{policyOverridesError}</div>
            ) : policyOverrides.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No policy overrides found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Policy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {policyOverrides.map((override) => (
                      <tr key={override.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {override.policy?.policy_number}
                          </div>
                          <div className="text-sm text-slate-500">
                            {override.policy?.customer}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {override.agent ? 
                            `${override.agent.first_name} ${override.agent.last_name}` : 
                            'All Agents'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {override.original_rate}% → {override.override_rate}%
                          </div>
                          <div className="text-xs text-slate-500">
                            {override.override_rate > override.original_rate ? 
                              `+${(override.override_rate - override.original_rate).toFixed(2)}%` :
                              `${(override.override_rate - override.original_rate).toFixed(2)}%`
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                          {override.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={override.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {override.status === 'pending' && override.created_by !== user?.id && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStatusUpdate('policy', override.id, 'approved')}
                                className="text-green-600 hover:text-green-900 px-2 py-1 text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleStatusUpdate('policy', override.id, 'rejected', reason);
                                }}
                                className="text-red-600 hover:text-red-900 px-2 py-1 text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {override.status === 'rejected' && override.rejection_reason && (
                            <div className="text-xs text-red-600 max-w-xs truncate" title={override.rejection_reason}>
                              {override.rejection_reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Overrides Tab */}
      {activeTab === 'agent' && (
        <div className="space-y-4">
          {/* Add Agent Override Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAgentForm(!showAgentForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Add Agent Override
            </button>
          </div>

          {/* Agent Override Form */}
          {showAgentForm && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-4">Create Agent Override</h4>
              <form onSubmit={handleAgentFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!agentId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agent</label>
                    <select
                      value={agentFormData.agent_id}
                      onChange={(e) => setAgentFormData(prev => ({ ...prev, agent_id: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select Agent</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.first_name} {agent.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
                  <select
                    value={agentFormData.transaction_type}
                    onChange={(e) => setAgentFormData(prev => ({ ...prev, transaction_type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select Transaction Type</option>
                    {TRANSACTION_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Carrier (Optional)</label>
                  <select
                    value={agentFormData.carrier_id}
                    onChange={(e) => setAgentFormData(prev => ({ ...prev, carrier_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">All Carriers</option>
                    {carriers.map((carrier) => (
                      <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">MGA Name (Optional)</label>
                  <input
                    type="text"
                    value={agentFormData.mga_name}
                    onChange={(e) => setAgentFormData(prev => ({ ...prev, mga_name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Enter MGA name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Override Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={agentFormData.override_rate}
                    onChange={(e) => setAgentFormData(prev => ({ ...prev, override_rate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Effective From</label>
                  <input
                    type="date"
                    value={agentFormData.effective_from}
                    onChange={(e) => setAgentFormData(prev => ({ ...prev, effective_from: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={agentFormData.effective_to}
                    onChange={(e) => setAgentFormData(prev => ({ ...prev, effective_to: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    min={agentFormData.effective_from}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                  <textarea
                    value={agentFormData.reason}
                    onChange={(e) => setAgentFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Create Override
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAgentForm(false)}
                    className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Agent Overrides List */}
          <div className="bg-white rounded-lg border border-slate-200">
            {agentOverridesLoading ? (
              <div className="p-8 text-center text-slate-500">Loading agent overrides...</div>
            ) : agentOverridesError ? (
              <div className="p-8 text-center text-red-600">{agentOverridesError}</div>
            ) : agentOverrides.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No agent overrides found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Transaction Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Carrier/MGA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Effective Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {agentOverrides.map((override) => (
                      <tr key={override.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {override.agent?.first_name} {override.agent?.last_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {override.agent?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {override.transaction_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {override.carrier?.name || override.mga_name || 'All'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {override.override_rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {new Date(override.effective_from).toLocaleDateString()}
                          </div>
                          {override.effective_to && (
                            <div className="text-xs text-slate-500">
                              to {new Date(override.effective_to).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={override.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {override.status === 'pending' && override.created_by !== user?.id && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStatusUpdate('agent', override.id, 'approved')}
                                className="text-green-600 hover:text-green-900 px-2 py-1 text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleStatusUpdate('agent', override.id, 'rejected', reason);
                                }}
                                className="text-red-600 hover:text-red-900 px-2 py-1 text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {override.status === 'rejected' && override.rejection_reason && (
                            <div className="text-xs text-red-600 max-w-xs truncate" title={override.rejection_reason}>
                              {override.rejection_reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}