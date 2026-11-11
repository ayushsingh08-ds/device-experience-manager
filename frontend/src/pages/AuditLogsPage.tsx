import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { AuditIcon, Clock, UserCheck } from '../components/sketch/AnimatedIcons';

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiRequest('/audit-logs?limit=50'),
    refetchInterval: 5000,
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-1">
        <div className="flex items-center gap-2.5">
          <AuditIcon size={20} className="text-neutral-950" />
          <h1 className="font-sketch font-bold text-2xl text-neutral-950 tracking-wide">
            Security & Compliance Audit Trail
          </h1>
        </div>
        <p className="text-xs text-neutral-600 font-sans mt-0.5">
          Immutable ledger of administrative decisions, enrollments, and remediation executions.
        </p>
      </div>

      {/* Sketched Table */}
      <div className="sketch-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-neutral-900 bg-[#fbf9f5] text-[11px] font-sketch tracking-wider text-neutral-700 uppercase">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Operator / User</th>
                <th className="py-3 px-5">Action Performed</th>
                <th className="py-3 px-5">Resource Type</th>
                <th className="py-3 px-5">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 font-sketch text-sm">
                    Loading compliance audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-600 font-sketch text-sm">
                    No compliance records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-5 font-mono text-neutral-600 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} strokeWidth={1.8} className="text-neutral-700 shrink-0" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5 font-bold text-neutral-950">
                        <UserCheck size={13} strokeWidth={1.8} className="text-neutral-800 shrink-0" />
                        <span>{log.user?.name || 'System / Automated'}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">{log.user?.email}</div>
                    </td>
                    <td className="py-3 px-5 font-mono">
                      <span className="px-2 py-0.5 border border-neutral-900 rounded bg-[#f5f3ee] text-neutral-900 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-neutral-800 font-medium">
                      {log.resource}
                    </td>
                    <td className="py-3 px-5 font-mono text-neutral-600 text-[11px] max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
