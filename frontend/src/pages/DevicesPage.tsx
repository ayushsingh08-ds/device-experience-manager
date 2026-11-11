import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import {
  DeviceIcon,
  Plus,
  Search,
  Filter,
  X,
  SketchLaptopEmpty,
} from '../components/sketch/AnimatedIcons';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <DeviceIcon size={20} className="text-neutral-950" />
            <h1 className="font-sketch font-bold text-2xl text-neutral-950 tracking-wide">
              Fleet Inventory
            </h1>
          </div>
          <p className="text-xs text-neutral-600 font-sans mt-0.5">
            Manage, monitor, and enroll organization endpoint devices.
          </p>
        </div>

        {user?.role !== 'VIEWER' && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="sketch-btn-black px-4 py-2 text-xs font-sketch font-bold flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} className="text-white" />
            <span>Enroll New Endpoint</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 sketch-card bg-white">
        <div className="relative w-full sm:w-72">
          <Search size={14} strokeWidth={1.8} className="absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search hostname or IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sketch-input pl-8.5 pr-3 py-1.5 text-xs font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter size={13} strokeWidth={1.8} className="text-neutral-600 shrink-0" />
          {['', 'ONLINE', 'OFFLINE', 'DEGRADED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-sketch transition-all cursor-pointer rounded-lg ${
                statusFilter === st
                  ? 'border-[1.5px] border-neutral-950 bg-neutral-950 text-white font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,0.8)]'
                  : 'border border-neutral-300 hover:border-neutral-950 text-neutral-700 bg-white'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Devices Table */}
      <div className="sketch-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-neutral-900 bg-[#fbf9f5] text-[11px] font-sketch tracking-wider text-neutral-700 uppercase">
                <th className="py-3 px-5">Hostname</th>
                <th className="py-3 px-5">IP / MAC</th>
                <th className="py-3 px-5">Operating System</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Open Incidents</th>
                <th className="py-3 px-5">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 font-sketch text-sm">
                    Loading fleet records...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <SketchLaptopEmpty className="w-16 h-12 mb-2 text-neutral-900 opacity-90" />
                      <p className="font-sketch text-sm text-neutral-800">
                        No devices matching current search or filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                devices.map((d: any) => (
                  <tr key={d.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-5 font-bold text-neutral-950 font-mono text-[12px]">
                      <div className="flex items-center gap-2">
                        <DeviceIcon size={14} className="text-neutral-900 shrink-0" />
                        <span>{d.hostname}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-neutral-800">
                      <div>{d.ipAddress}</div>
                      <div className="text-[10px] text-neutral-500">{d.macAddress}</div>
                    </td>
                    <td className="py-3 px-5 text-neutral-800">
                      {d.os} <span className="text-[10px] text-neutral-500">({d.osVersion})</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-[10px] font-mono px-2 py-0.5 border border-neutral-900 rounded-full bg-white font-bold inline-flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            d.status === 'ONLINE' ? 'bg-emerald-600' : 'bg-neutral-400'
                          }`}
                        />
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      {d._count?.alerts > 0 ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 border border-neutral-900 rounded-full bg-amber-50 font-bold text-neutral-900">
                          {d._count.alerts} Open
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-mono">Clean</span>
                      )}
                    </td>
                    <td className="py-3 px-5 font-mono text-neutral-600 text-[11px]">
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
          <div className="p-3 border-t border-neutral-300 flex items-center justify-between text-xs text-neutral-600 bg-[#fbf9f5]">
            <span className="font-sketch">
              Showing Page {page} of {pagination.totalPages} ({pagination.total} endpoints)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 sketch-btn text-xs font-sketch disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 sketch-btn text-xs font-sketch disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sketched Enrollment Modal */}
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

            <h2 className="font-sketch font-bold text-lg text-neutral-950 mb-0.5">Enroll New Endpoint</h2>
            <p className="text-xs text-neutral-600 font-sans mb-4">
              Register an authorized client hardware device into fleet telemetry.
            </p>

            {modalError && (
              <div className="mb-4 p-2.5 border border-neutral-900 bg-rose-50 rounded-xl text-xs text-neutral-900 font-sans">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-3 font-sans">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                  Hostname
                </label>
                <input
                  type="text"
                  required
                  placeholder="WORKSTATION-01"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  className="w-full sketch-input px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                  IPv4 Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="192.168.1.50"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full sketch-input px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                  MAC Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="00:1B:44:11:3A:B7"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  className="w-full sketch-input px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                    Operating System
                  </label>
                  <input
                    type="text"
                    required
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    className="w-full sketch-input px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                    OS Build / Version
                  </label>
                  <input
                    type="text"
                    required
                    value={osVersion}
                    onChange={(e) => setOsVersion(e.target.value)}
                    className="w-full sketch-input px-3 py-1.5 text-xs"
                  />
                </div>
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
                  disabled={enrollMutation.isPending}
                  className="px-4 py-1.5 sketch-btn-black text-xs font-sketch font-bold disabled:opacity-50"
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
