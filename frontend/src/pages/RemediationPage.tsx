import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { Wrench, Play, Plus, X, Terminal, Clock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Remediation Console</h1>
          <p className="text-xs text-slate-400 mt-1">Review, approve, and simulate automated endpoint resolution tasks.</p>
        </div>

        {user?.role !== 'VIEWER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Request Remediation
          </button>
        )}
      </div>

      {/* Remediation Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading remediation tasks...</div>
        ) : remediations.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No active remediation requests</h3>
            <p className="text-xs text-slate-500 mt-1">Request an automated troubleshooting task for any endpoint above.</p>
          </div>
        ) : (
          remediations.map((rem: any) => {
            const isPending = rem.status === 'PENDING_APPROVAL';
            const isCompleted = rem.status === 'COMPLETED';

            return (
              <div
                key={rem.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">{rem.actionType}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isPending ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {rem.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target Endpoint: <span className="text-white font-semibold">{rem.device?.hostname}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {isPending && user?.role !== 'VIEWER' && (
                    <button
                      onClick={() => approveMutation.mutate(rem.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Approve & Execute
                    </button>
                  )}
                </div>

                {/* Output Terminal Log if Completed */}
                {rem.outputLog && (
                  <div className="mt-3 p-3 bg-slate-950 border border-slate-800/80 rounded-xl font-mono text-[11px] text-slate-300 flex items-start gap-2.5">
                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="overflow-x-auto whitespace-pre-wrap">{rem.outputLog}</div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(rem.createdAt).toLocaleString()}</span>
                  {rem.user && (
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-400" /> Approved by {rem.user.name}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Request Endpoint Remediation</h2>
            <p className="text-xs text-slate-400 mb-5">Queue a corrective simulated action for an endpoint device.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Endpoint</label>
                <select
                  required
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a device...</option>
                  {devices.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.hostname} ({d.ipAddress})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Corrective Action Script</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="CLEANUP_TEMP_FILES">Cleanup Temp Files (Purge cache, reclaim disk)</option>
                  <option value="RESTART_BACKGROUND_SERVICE">Restart Background Service (Normalize RAM pressure)</option>
                  <option value="RETRY_FAILED_UPDATES">Retry Failed Updates (Re-apply software patch)</option>
                  <option value="RESET_NETWORK_ADAPTER">Reset Network Adapter (Flush DNS & gateway)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !selectedDevice}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
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
