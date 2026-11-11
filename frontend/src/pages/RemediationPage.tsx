import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import {
  RemediationIcon,
  Plus,
  X,
  Terminal,
  Clock,
  UserCheck,
  Play,
} from '../components/sketch/AnimatedIcons';

export default function RemediationPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [actionType, setActionType] = useState('CLEANUP_TEMP_FILES');

  // Query remediations
  const { data, isLoading } = useQuery({
    queryKey: ['remediations'],
    queryFn: () => apiRequest('/remediations?limit=50'),
    refetchInterval: 5000,
  });

  // Query devices for modal dropdown
  const { data: devicesData } = useQuery({
    queryKey: ['devices', 'dropdown'],
    queryFn: () => apiRequest('/devices?limit=100'),
    enabled: isModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest('/remediations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] });
      setIsModalOpen(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/remediations/${id}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    createMutation.mutate({ deviceId: selectedDevice, actionType });
  };

  const remediations = data?.data || [];
  const devices = devicesData?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <RemediationIcon size={20} className="text-neutral-950" />
            <h1 className="font-sketch font-bold text-2xl text-neutral-950 tracking-wide">
              Remediation Console
            </h1>
          </div>
          <p className="text-xs text-neutral-600 font-sans mt-0.5">
            Review, approve, and simulate automated endpoint resolution tasks.
          </p>
        </div>

        {user?.role !== 'VIEWER' && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="sketch-btn-black px-4 py-2 text-xs font-sketch font-bold flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} className="text-white" />
            <span>Request Remediation</span>
          </button>
        )}
      </div>

      {/* Remediation Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500 font-sketch text-sm">
            Loading remediation tasks...
          </div>
        ) : remediations.length === 0 ? (
          <div className="sketch-card bg-white p-12 text-center">
            <RemediationIcon size={32} className="mx-auto mb-2 text-neutral-700" />
            <h3 className="font-sketch font-bold text-base text-neutral-950">
              No active remediation requests
            </h3>
            <p className="text-xs text-neutral-600 font-sans mt-1">
              Queue an automated troubleshooting script for any enrolled endpoint above.
            </p>
          </div>
        ) : (
          remediations.map((rem: any) => {
            const isPending = rem.status === 'PENDING_APPROVAL';
            const isCompleted = rem.status === 'COMPLETED';

            return (
              <div
                key={rem.id}
                className="sketch-card bg-white p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border-[1.5px] border-neutral-950 rounded-xl bg-neutral-50 shrink-0">
                      <RemediationIcon size={17} className="text-neutral-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-neutral-950">{rem.actionType}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border border-neutral-900 rounded uppercase ${
                          isPending
                            ? 'bg-amber-100 text-neutral-950'
                            : isCompleted
                            ? 'bg-emerald-100 text-neutral-950'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {rem.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-sans mt-0.5">
                        Target Endpoint: <span className="font-bold text-neutral-950 font-mono">{rem.device?.hostname}</span>
                      </p>
                    </div>
                  </div>

                  {/* Approve action */}
                  {isPending && user?.role !== 'VIEWER' && (
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(rem.id)}
                      disabled={approveMutation.isPending}
                      className="sketch-btn-black px-3.5 py-1.5 text-xs font-sketch font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Play size={13} strokeWidth={2} className="text-white" />
                      <span>Approve & Execute</span>
                    </button>
                  )}
                </div>

                {/* Simulated Terminal Log Output */}
                {rem.outputLog && (
                  <div className="mt-2 p-3 border-[1.5px] border-neutral-900 bg-[#f8f6f0] rounded-xl font-mono text-[11px] text-neutral-900 flex items-start gap-2 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.06)]">
                    <Terminal size={15} strokeWidth={1.8} className="text-neutral-950 shrink-0 mt-0.5" />
                    <div className="overflow-x-auto whitespace-pre-wrap leading-relaxed">{rem.outputLog}</div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} strokeWidth={1.8} className="text-neutral-700" />
                    {new Date(rem.createdAt).toLocaleString()}
                  </span>
                  {rem.user && (
                    <span className="flex items-center gap-1 font-semibold text-neutral-800">
                      <UserCheck size={12} strokeWidth={1.8} className="text-neutral-700" />
                      Approved by {rem.user.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sketched Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-[#faf8f5] border-[2px] border-neutral-950 rounded-2xl max-w-md w-full p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg hover:bg-neutral-200 text-neutral-800"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <h2 className="font-sketch font-bold text-lg text-neutral-950 mb-0.5">Request Endpoint Remediation</h2>
            <p className="text-xs text-neutral-600 font-sans mb-4">
              Queue a corrective simulated action for an endpoint device.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                  Target Endpoint
                </label>
                <select
                  required
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full sketch-input px-3 py-1.5 text-xs bg-white"
                >
                  <option value="">Select an enrolled endpoint...</option>
                  {devices.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.hostname} ({d.ipAddress})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                  Corrective Action Script
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full sketch-input px-3 py-1.5 text-xs bg-white"
                >
                  <option value="CLEANUP_TEMP_FILES">Cleanup Temp Files (Purge cache, reclaim disk)</option>
                  <option value="RESTART_BACKGROUND_SERVICE">Restart Background Service (Normalize RAM pressure)</option>
                  <option value="RETRY_FAILED_UPDATES">Retry Failed Updates (Re-apply software patch)</option>
                  <option value="RESET_NETWORK_ADAPTER">Reset Network Adapter (Flush DNS & gateway)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 sketch-btn text-xs font-sketch font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !selectedDevice}
                  className="px-4 py-1.5 sketch-btn-black text-xs font-sketch font-bold disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Queuing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
