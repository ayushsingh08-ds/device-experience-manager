import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import {
  AlertsIcon,
  IncidentIcon,
  ArrowRight,
  SketchCheckEmpty,
} from '../components/sketch/AnimatedIcons';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('OPEN');

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', statusFilter],
    queryFn: () => {
      let url = '/alerts?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      return apiRequest(url);
    },
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/alerts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const alerts = data?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <AlertsIcon size={20} className="text-neutral-950" />
            <h1 className="font-sketch font-bold text-2xl text-neutral-950 tracking-wide">
              Alerts & Incident Console
            </h1>
          </div>
          <p className="text-xs text-neutral-600 font-sans mt-0.5">
            Real-time telemetry incidents evaluated by the Diagnostic Rule Engine.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex p-1 sketch-card bg-white gap-1">
          {['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-sketch font-bold transition-all cursor-pointer rounded-lg ${
                statusFilter === st
                  ? 'border-[1.5px] border-neutral-950 bg-neutral-950 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.8)]'
                  : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500 font-sketch text-sm">
            Loading incident queue...
          </div>
        ) : alerts.length === 0 ? (
          <div className="sketch-card bg-white p-12 text-center">
            <SketchCheckEmpty className="w-14 h-14 mx-auto mb-2 text-neutral-900" />
            <h3 className="font-sketch font-bold text-base text-neutral-950">
              No {statusFilter.toLowerCase()} incidents
            </h3>
            <p className="text-xs text-neutral-600 font-sans mt-1">
              All endpoint telemetry metrics are currently operating within normal operational bounds.
            </p>
          </div>
        ) : (
          alerts.map((alert: any) => {
            return (
              <div
                key={alert.id}
                className="sketch-card bg-white p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 border-[1.5px] border-neutral-950 rounded-xl bg-neutral-50 shrink-0 mt-0.5">
                    <IncidentIcon size={18} className="text-neutral-950" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-sketch font-bold text-sm text-neutral-950">{alert.title}</h3>
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.2 border border-neutral-900 rounded bg-neutral-100">
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-700 font-sans mt-0.5">{alert.description}</p>

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-neutral-500 font-mono">
                      <span>Target: {alert.device?.hostname} ({alert.device?.ipAddress})</span>
                      <span>Triggered: {new Date(alert.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-200">
                  {alert.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: alert.id, status: 'ACKNOWLEDGED' })}
                      className="px-3 py-1.5 sketch-btn text-xs font-sketch font-bold"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: alert.id, status: 'RESOLVED' })}
                      className="px-3 py-1.5 sketch-btn text-xs font-sketch font-bold"
                    >
                      Resolve
                    </button>
                  )}

                  <Link
                    to="/remediations"
                    className="sketch-btn-black px-3.5 py-1.5 text-xs font-sketch font-bold flex items-center gap-1.5"
                  >
                    <span>Remediate</span>
                    <ArrowRight size={13} strokeWidth={2} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
