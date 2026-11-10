import { Activity, ShieldCheck, Cpu } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Device Experience Manager
            </h1>
            <p className="text-xs text-slate-400">
              Endpoint Telemetry & Automated Remediation
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-400">
              <Cpu className="w-4 h-4 text-emerald-400" /> System Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Operational
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Platform Core
            </span>
            <span className="text-xs text-slate-300 font-mono">React 19 + Tailwind v4</span>
          </div>
        </div>

        <p className="text-xs text-center text-slate-500">
          Phase 1 Initialized • Ready for Database & Telemetry Pipelines
        </p>
      </div>
    </div>
  );
}
