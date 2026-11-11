import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import {
  DashboardIcon,
  DeviceIcon,
  AlertsIcon,
  RemediationIcon,
  AuditIcon,
  SignOutIcon,
  SketchShieldLogo,
} from './sketch/AnimatedIcons';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', Icon: DashboardIcon },
    { name: 'Device Inventory', path: '/devices', Icon: DeviceIcon },
    { name: 'Alerts Console', path: '/alerts', Icon: AlertsIcon },
    { name: 'Remediation', path: '/remediations', Icon: RemediationIcon },
    { name: 'Audit Trail', path: '/audit-logs', Icon: AuditIcon },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] p-3 sm:p-5 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Outer Sketch Border Container Framing Entire Workspace */}
      <div className="flex-1 border-[1.8px] border-neutral-900 rounded-2xl bg-[#fdfcf9] flex flex-col overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
        
        {/* Top Header Bar */}
        <header className="h-11 border-b-[1.5px] border-neutral-900 px-5 flex items-center justify-between bg-[#fbf9f5] text-xs text-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5 font-sketch text-sm tracking-wide">
            <Home size={15} strokeWidth={1.8} className="text-neutral-900" />
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-900 font-medium font-sans text-xs">
              Endpoint Telemetry Ingestion Active
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-600">
            <span className="w-2 h-2 rounded-full bg-neutral-900 inline-block animate-pulse" />
            <span>v1.0.0-production-ready</span>
          </div>
        </header>

        {/* Main Body: Sidebar + Workspace */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <aside className="w-56 sm:w-60 border-r-[1.5px] border-neutral-900 bg-[#fbf9f5] flex flex-col justify-between shrink-0">
            <div>
              {/* Brand Logo & Title */}
              <div className="p-4 border-b-[1.5px] border-neutral-900 flex items-center gap-3">
                <SketchShieldLogo className="w-8 h-8 shrink-0" />
                <div>
                  <h1 className="font-sketch font-bold text-base text-neutral-950 leading-none">
                    DEM Platform
                  </h1>
                  <p className="text-[10px] text-neutral-600 font-sketch tracking-tight mt-0.5">
                    Endpoint Health Suite
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="p-3 space-y-1.5">
                {navItems.map((item) => {
                  const { Icon } = item;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-sketch text-[14px] transition-all ${
                          isActive
                            ? 'border-[1.5px] border-neutral-950 bg-white font-bold text-neutral-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.8)]'
                            : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/50 border border-transparent'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0 text-neutral-950" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Operator Card & Sign Out */}
            <div className="p-3 border-t-[1.5px] border-neutral-900 bg-[#fdfcf9] space-y-2.5">
              <div className="border border-neutral-800 rounded-xl p-2.5 bg-white/70 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-neutral-900 flex items-center justify-center bg-neutral-100 shrink-0">
                  <UserIcon size={13} strokeWidth={1.8} className="text-neutral-900" />
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-neutral-900 truncate leading-tight">
                      {user?.name || 'Ayush Singh'}
                    </p>
                    <span className="text-[9px] font-mono px-1 py-0.2 border border-neutral-900 rounded bg-neutral-100 uppercase shrink-0 font-bold">
                      {user?.role || 'OPERATOR'}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate font-mono mt-0.5">
                    {user?.email || 'admin@dem.local'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-1.5 px-3 sketch-btn text-xs font-sketch font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <SignOutIcon className="w-3.5 h-3.5 text-neutral-950" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content */}
          <main className="flex-1 overflow-y-auto bg-[#fdfcf9] p-5 sm:p-7">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
