import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { Server, AlertTriangle, CheckCircle2, Activity, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => apiRequest('/devices?limit=100'),
    refetchInterval: 5000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts', 'open'],
    queryFn: () => apiRequest('/alerts?status=OPEN'),
    refetchInterval: 5000,
  });

  const { data: remediationsData } = useQuery({
    queryKey: ['remediations'],
    queryFn: () => apiRequest('/remediations?limit=100'),
    refetchInterval: 5000,
  });

  const devices = devicesData?.data || [];
  const totalDevices = devicesData?.pagination?.total || 0;
  const onlineDevices = devices.filter((d: any) => d.status === 'ONLINE').length;
  const healthPercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 100;
  const activeAlerts = alertsData?.data || [];
  const openAlertsCount = alertsData?.pagination?.total || 0;
  const remediations = remediationsData?.data || [];
  const completedRemediations = remediations.filter((r: any) => r.status === 'COMPLETED').length;

  const stats = [
    {
      title: 'Enrolled Devices',
      value: totalDevices,
      sub: `${onlineDevices} Online / ${totalDevices - onlineDevices} Offline`,
      icon: Server,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: 'Fleet Health Score',
      value: `${healthPercentage}%`,
      sub: 'Based on heartbeat checks',
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Active Incidents',
      value: openAlertsCount,
      sub: 'Requiring operational review',
      icon: AlertTriangle,
      color: openAlertsCount > 0 ? 'text-amber-400' : 'text-slate-400',
      bg: openAlertsCount > 0 ? 'bg-amber-500/10' : 'bg-slate-800/40',
      border: openAlertsCount > 0 ? 'border-amber-500/30' : 'border-slate-800',
    },
    {
      title: 'Completed Remediations',
      value: completedRemediations,
      sub: 'Simulated corrective actions',
      icon: CheckCircle2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Executive Fleet Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time health, anomaly telemetry, and automated remediation tracking.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`p-5 rounded-2xl bg-slate-900 border ${stat.border} flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">{stat.title}</span>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Devices & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              Connected Endpoints
            </h2>
            <Link to="/devices" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {devices.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No devices enrolled.</p>
            ) : (
              devices.slice(0, 5).map((d: any) => (
                <div key={d.id} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{d.hostname}</p>
                    <p className="text-xs text-slate-500 font-mono">{d.ipAddress} • {d.os}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    d.status === 'ONLINE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Active System Alerts
            </h2>
            <Link to="/alerts" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
              Alerts Center <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {activeAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400/60 mb-2" />
                <p className="text-xs">All endpoints healthy. No active alerts.</p>
              </div>
            ) : (
              activeAlerts.slice(0, 5).map((a: any) => (
                <div key={a.id} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{a.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        a.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                        a.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{a.description}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Target: {a.device?.hostname}</p>
                  </div>
                  <Link
                    to="/remediations"
                    className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors shrink-0"
                  >
                    Remediate
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
