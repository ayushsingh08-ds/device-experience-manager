import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { Clock, UserCheck } from 'lucide-react';

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiRequest('/audit-logs?limit=50'),
    refetchInterval: 5000,
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security & Compliance Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">Immutable ledger of administrative decisions, enrollments, and remediation executions.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Operator / User</th>
                <th className="py-3.5 px-5">Action Performed</th>
                <th className="py-3.5 px-5">Resource Type</th>
                <th className="py-3.5 px-5">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading compliance audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{log.user?.name || 'System / Automated'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{log.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-5 font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 font-medium">
                      {log.resource}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px] max-w-xs truncate">
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
