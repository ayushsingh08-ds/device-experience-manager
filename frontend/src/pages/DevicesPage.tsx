import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { Server, Plus, Search, Filter, AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [os, setOs] = useState('Windows 11 Enterprise');
  const [osVersion, setOsVersion] = useState('23H2');
  const [modalError, setModalError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['devices', page, statusFilter, search],
    queryFn: () => {
      let url = `/devices?page=${page}&limit=10`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return apiRequest(url);
    },
    refetchInterval: 5000,
  });

  const enrollMutation = useMutation({
    mutationFn: (newDevice: any) =>
      apiRequest('/devices/register', {
        method: 'POST',
        body: JSON.stringify(newDevice),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsModalOpen(false);
      setHostname('');
      setIpAddress('');
      setMacAddress('');
      setModalError(null);
    },
    onError: (err: any) => {
      setModalError(err.message || 'Failed to enroll device');
    },
  });

  const handleEnrollSubmit = (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);
    enrollMutation.mutate({ hostname, ipAddress, macAddress, os, osVersion });
  };

  const devices = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fleet Inventory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage, monitor, and enroll organization endpoint devices.</p>
        </div>

        {user?.role !== 'VIEWER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Enroll New Endpoint
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search hostname or IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {['', 'ONLINE', 'OFFLINE', 'DEGRADED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/40 border border-transparent'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <th className="py-3.5 px-5">Hostname</th>
                <th className="py-3.5 px-5">IP / MAC</th>
                <th className="py-3.5 px-5">Operating System</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Open Incidents</th>
                <th className="py-3.5 px-5">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading fleet records...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No devices matching the current filters.
                  </td>
                </tr>
              ) : (
                devices.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{d.hostname}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-300">
                      <div>{d.ipAddress}</div>
                      <div className="text-[10px] text-slate-500">{d.macAddress}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      {d.os} <span className="text-[10px] text-slate-500">({d.osVersion})</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        d.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {d._count?.alerts > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {d._count.alerts} Open
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Clean</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">
                      {d.lastHeartbeat ? new Date(d.lastHeartbeat).toLocaleTimeString() : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing Page {page} of {pagination.totalPages} ({pagination.total} endpoints)</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enrollment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Enroll New Endpoint</h2>
            <p className="text-xs text-slate-400 mb-5">Register an authorized client device into fleet telemetry.</p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hostname</label>
                <input
                  type="text"
                  required
                  placeholder="WORKSTATION-01"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">IPv4 Address</label>
                <input
                  type="text"
                  required
                  placeholder="192.168.1.50"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">MAC Address</label>
                <input
                  type="text"
                  required
                  placeholder="00:1B:44:11:3A:B7"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Operating System</label>
                  <input
                    type="text"
                    required
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">OS Build/Version</label>
                  <input
                    type="text"
                    required
                    value={osVersion}
                    onChange={(e) => setOsVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                  disabled={enrollMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                >
                  {enrollMutation.isPending ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
