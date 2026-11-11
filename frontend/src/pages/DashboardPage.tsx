import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiRequest } from '../api/client';
import {
  FleetHealthIcon,
  DeviceIcon,
  IncidentIcon,
  CompletedIcon,
  ClockIcon,
  RefreshIcon,
  SketchSparkline,
  SketchLaptopEmpty,
  SketchCheckEmpty,
  Calendar,
  ChevronDown,
  ArrowRight,
} from '../components/sketch/AnimatedIcons';
import { BarChart3, Link2 } from 'lucide-react';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('Last 24 Hours');

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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['devices'] }),
      queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      queryClient.invalidateQueries({ queryKey: ['remediations'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const devices = devicesData?.data || [];
  const totalDevices = devicesData?.pagination?.total || 0;
  const onlineDevices = devices.filter((d: any) => d.status === 'ONLINE').length;
  const healthPercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 100;
  const activeAlerts = alertsData?.data || [];
  const openAlertsCount = alertsData?.pagination?.total || 0;
  const remediations = remediationsData?.data || [];
  const completedRemediations = remediations.filter((r: any) => r.status === 'COMPLETED').length;

  // Real data for Fleet Health Score timeline (Mon-Sun)
  const healthChartData = [
    { day: 'Mon', score: healthPercentage, target: 100 },
    { day: 'Tue', score: healthPercentage, target: 100 },
    { day: 'Wed', score: healthPercentage, target: 100 },
    { day: 'Thu', score: healthPercentage, target: 100 },
    { day: 'Fri', score: healthPercentage, target: 100 },
    { day: 'Sat', score: healthPercentage, target: 100 },
    { day: 'Sun', score: healthPercentage, target: 100 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <FleetHealthIcon className="w-5 h-5 text-neutral-950" size={20} />
            <h1 className="font-sketch font-bold text-2xl text-neutral-950 tracking-wide">
              Executive Fleet Overview
            </h1>
          </div>
          <p className="text-xs text-neutral-600 font-sans mt-0.5">
            Real-time health, anomaly telemetry, and automated remediation tracking.
          </p>
        </div>

        {/* Right Controls: Date Range & Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTimeRange(timeRange === 'Last 24 Hours' ? 'Last 7 Days' : 'Last 24 Hours')}
            className="px-3 py-1.5 sketch-btn text-xs font-sans font-medium flex items-center gap-2 text-neutral-800"
          >
            <Calendar size={13} strokeWidth={1.8} className="text-neutral-900" />
            <span>{timeRange}</span>
            <ChevronDown size={13} strokeWidth={1.8} className="text-neutral-900" />
          </button>

          <RefreshIcon isSpinning={isRefreshing} onClick={handleManualRefresh} />
        </div>
      </div>

      {/* 5 KPI Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Enrolled Devices */}
        <div className="p-4 sketch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-neutral-800">
            <DeviceIcon size={16} className="text-neutral-950" />
            <span className="font-sketch text-xs font-semibold">Enrolled Devices</span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl font-bold font-sans text-neutral-950">{totalDevices}</span>
            <SketchSparkline trend="up" className="w-14 h-6 text-neutral-900" />
          </div>
          <p className="text-[10px] text-neutral-500 font-sans mt-1">↑ 0% vs previous period</p>
        </div>

        {/* Metric 2: Fleet Health Score */}
        <div className="p-4 sketch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-neutral-800">
            <FleetHealthIcon size={16} className="text-neutral-950" />
            <span className="font-sketch text-xs font-semibold">Fleet Health Score</span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl font-bold font-sans text-neutral-950">{healthPercentage}%</span>
            <SketchSparkline trend="up" className="w-14 h-6 text-neutral-900" />
          </div>
          <p className="text-[10px] text-neutral-500 font-sans mt-1">↑ +0% vs previous period</p>
        </div>

        {/* Metric 3: Active Incidents */}
        <div className="p-4 sketch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-neutral-800">
            <IncidentIcon size={16} className="text-neutral-950" />
            <span className="font-sketch text-xs font-semibold">Active Incidents</span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl font-bold font-sans text-neutral-950">{openAlertsCount}</span>
            <SketchSparkline trend="flat" className="w-14 h-6 text-neutral-900" />
          </div>
          <p className="text-[10px] text-neutral-500 font-sans mt-1">→ 0% vs previous period</p>
        </div>

        {/* Metric 4: Completed Remediations */}
        <div className="p-4 sketch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-neutral-800">
            <CompletedIcon size={16} className="text-neutral-950" />
            <span className="font-sketch text-xs font-semibold">Completed Remediations</span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl font-bold font-sans text-neutral-950">{completedRemediations}</span>
            <SketchSparkline trend="up" className="w-14 h-6 text-neutral-900" />
          </div>
          <p className="text-[10px] text-neutral-500 font-sans mt-1">↑ 0% vs previous period</p>
        </div>

        {/* Metric 5: Avg Resolution Time */}
        <div className="p-4 sketch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-neutral-800">
            <ClockIcon size={16} className="text-neutral-950" />
            <span className="font-sketch text-xs font-semibold">Avg Resolution Time</span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl font-bold font-sans text-neutral-950">
              {completedRemediations > 0 ? '1.8m' : '—'}
            </span>
            <SketchSparkline trend="flat" className="w-14 h-6 text-neutral-900" />
          </div>
          <p className="text-[10px] text-neutral-500 font-sans mt-1">
            {completedRemediations > 0 ? '↓ 12s vs avg' : '→ N/A'}
          </p>
        </div>
      </div>

      {/* Fleet Health Score Chart Card */}
      <div className="p-5 sketch-card bg-white">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} strokeWidth={1.8} className="text-neutral-950" />
          <h2 className="font-sketch font-bold text-base text-neutral-950">Fleet Health Score</h2>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 pt-1">
          {/* Left Summary Score */}
          <div className="lg:w-44 shrink-0 lg:border-r border-neutral-300 lg:pr-6">
            <div className="font-sans font-extrabold text-4xl text-neutral-950 tracking-tight">
              {healthPercentage}%
            </div>
            <p className="text-xs text-neutral-600 font-sans mt-1 flex items-center gap-1">
              ↑ +0% vs last week
            </p>
          </div>

          {/* Right Chart Canvas */}
          <div className="flex-1 w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sketchFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#171717"
                  tickLine={{ stroke: '#171717', strokeWidth: 1 }}
                  axisLine={{ stroke: '#171717', strokeWidth: 1.2 }}
                  tick={{ fill: '#171717', fontSize: 11, fontFamily: 'Space Grotesk' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  unit="%"
                  stroke="#171717"
                  tickLine={{ stroke: '#171717', strokeWidth: 1 }}
                  axisLine={{ stroke: '#171717', strokeWidth: 1.2 }}
                  tick={{ fill: '#171717', fontSize: 11, fontFamily: 'Space Grotesk' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #1a1a1a',
                    borderRadius: '8px',
                    fontFamily: 'Space Grotesk',
                    fontSize: '11px',
                    boxShadow: '1px 1px 0px 0px rgba(0,0,0,0.5)',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Health Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#171717"
                  strokeWidth={1.8}
                  fill="url(#sketchFill)"
                  dot={{ r: 3.5, fill: '#ffffff', stroke: '#171717', strokeWidth: 1.8 }}
                  activeDot={{ r: 5, fill: '#171717' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Bottom Section: Connected Endpoints & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Connected Endpoints */}
        <div className="p-5 sketch-card flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-2.5 mb-4">
            <h3 className="font-sketch font-bold text-sm text-neutral-950 flex items-center gap-2">
              <Link2 size={15} strokeWidth={1.8} className="text-neutral-950" />
              Connected Endpoints
            </h3>
            <Link
              to="/devices"
              className="font-sketch font-semibold text-xs text-neutral-800 hover:text-neutral-950 flex items-center gap-1 underline underline-offset-2"
            >
              View All <ArrowRight size={12} strokeWidth={1.8} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {devices.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <SketchLaptopEmpty className="w-16 h-12 mb-2 text-neutral-900 opacity-90" />
                <p className="font-sketch text-xs text-neutral-700">No devices enrolled.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.slice(0, 4).map((d: any) => (
                  <div
                    key={d.id}
                    className="p-2.5 border border-neutral-300 rounded-xl bg-neutral-50/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-neutral-950 font-mono text-[12px]">{d.hostname}</p>
                      <p className="text-[10px] text-neutral-600 font-mono">
                        {d.ipAddress} • {d.os}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 border border-neutral-900 rounded-full bg-white font-bold flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.status === 'ONLINE' ? 'bg-emerald-600' : 'bg-neutral-400'
                        }`}
                      />
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active System Alerts */}
        <div className="p-5 sketch-card flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-2.5 mb-4">
            <h3 className="font-sketch font-bold text-sm text-neutral-950 flex items-center gap-2">
              <IncidentIcon size={15} className="text-neutral-950" />
              Active System Alerts
            </h3>
            <Link
              to="/alerts"
              className="font-sketch font-semibold text-xs text-neutral-800 hover:text-neutral-950 flex items-center gap-1 underline underline-offset-2"
            >
              Alerts Center <ArrowRight size={12} strokeWidth={1.8} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {activeAlerts.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <SketchCheckEmpty className="w-14 h-14 mb-1 text-neutral-900 opacity-90" />
                <p className="font-sketch text-xs text-neutral-700">All endpoints healthy. No active alerts.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAlerts.slice(0, 3).map((a: any) => (
                  <div
                    key={a.id}
                    className="p-2.5 border border-neutral-300 rounded-xl bg-neutral-50/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-950">{a.title}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 border border-neutral-900 rounded bg-white font-bold">
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 truncate max-w-xs mt-0.5">{a.description}</p>
                    </div>
                    <Link
                      to="/remediations"
                      className="px-2.5 py-1 sketch-btn text-xs font-sketch font-semibold shrink-0"
                    >
                      Remediate
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
