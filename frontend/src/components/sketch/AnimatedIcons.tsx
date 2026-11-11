import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  LayoutDashboard,
  Monitor,
  Bell,
  Wrench,
  ShieldCheck,
  Activity,
  TriangleAlert,
  CircleCheck,
  Clock,
  RefreshCw,
  LogOut,
  Calendar,
  ChevronDown,
  ArrowRight,
  Plus,
  Search,
  Filter,
  X,
  Terminal,
  UserCheck,
  Shield,
  Layers,
  Play,
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
}

/** Dashboard: Subtle hover scale & wobble */
export const DashboardIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={shouldReduceMotion ? {} : { scale: 1.15, rotate: [0, -3, 3, 0] }}
      transition={{ duration: 0.2 }}
    >
      <LayoutDashboard size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Device Inventory: Monitor with small vertical hover nod */
export const DeviceIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.1 }}
      transition={{ duration: 0.18 }}
    >
      <Monitor size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Alerts Console: Bell with realistic bell ring tilt */
export const AlertsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              rotate: [0, -18, 18, -10, 10, -4, 0],
              transition: { duration: 0.45, ease: 'easeInOut' },
            }
      }
    >
      <Bell size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Remediation: Wrench with mechanical turn */
export const RemediationIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={shouldReduceMotion ? {} : { rotate: -25, scale: 1.1 }}
      transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
    >
      <Wrench size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Audit Trail: ShieldCheck with subtle draw / pulse */
export const AuditIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={shouldReduceMotion ? {} : { scale: 1.12 }}
      transition={{ duration: 0.2 }}
    >
      <ShieldCheck size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Fleet Health: Activity heartbeat pulse */
export const FleetHealthIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              scale: [1, 1.25, 1],
              transition: { duration: 0.35, ease: 'easeOut' },
            }
      }
    >
      <Activity size={size} strokeWidth={2} className={className} />
    </motion.span>
  );
};

/** Active Incidents: TriangleAlert with gentle attention shake */
export const IncidentIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              x: [0, -2, 2, -1, 1, 0],
              scale: 1.1,
              transition: { duration: 0.3 },
            }
      }
    >
      <TriangleAlert size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Completed Remediations: CircleCheck with satisfied pop */
export const CompletedIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
      transition={{ duration: 0.25 }}
    >
      <CircleCheck size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Resolution Time: Clock with hand spin */
export const ClockIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 18 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={shouldReduceMotion ? {} : { rotate: 360 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <Clock size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Refresh: RefreshCw rotating on click */
export const RefreshIcon: React.FC<{ isSpinning?: boolean; onClick?: () => void; className?: string }> = ({
  isSpinning = false,
  onClick,
  className = 'w-4 h-4',
}) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="p-1.5 sketch-btn inline-flex items-center justify-center cursor-pointer text-neutral-900"
      whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
      animate={isSpinning && !shouldReduceMotion ? { rotate: 360 } : {}}
      transition={isSpinning ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.2 }}
      title="Refresh fleet telemetry"
    >
      <RefreshCw size={15} strokeWidth={1.9} className={className} />
    </motion.button>
  );
};

/** Sign Out: LogOut with horizontal nudge */
export const SignOutIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5', size = 15 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex items-center justify-center text-neutral-950"
      whileHover={shouldReduceMotion ? {} : { x: 3 }}
      transition={{ duration: 0.15 }}
    >
      <LogOut size={size} strokeWidth={1.8} className={className} />
    </motion.span>
  );
};

/** Hand-sketched Sparkline curve for KPI Cards */
export const SketchSparkline: React.FC<{ trend?: 'up' | 'flat' | 'down'; className?: string }> = ({
  trend = 'up',
  className = 'w-16 h-7',
}) => {
  return (
    <svg viewBox="0 0 70 26" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {trend === 'up' && (
        <path
          d="M2 22C12 21 18 16 26 17C34 18 38 12 46 13C54 14 58 5 68 4"
          stroke="#171717"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {trend === 'flat' && (
        <path
          d="M2 14C14 13 22 15 32 14C42 13 52 15 68 14"
          stroke="#171717"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {trend === 'down' && (
        <path
          d="M2 5C14 6 22 12 32 11C42 14 52 21 68 22"
          stroke="#171717"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

/** Empty State 1: Hand-sketched Laptop */
export const SketchLaptopEmpty: React.FC<{ className?: string }> = ({ className = 'w-16 h-12' }) => {
  return (
    <svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Screen Outline */}
      <rect
        x="15"
        y="6"
        width="50"
        height="30"
        rx="3"
        stroke="#171717"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Screen Line */}
      <rect x="20" y="11" width="40" height="20" rx="1.5" stroke="#171717" strokeWidth="1" strokeDasharray="2 2" />
      {/* Laptop Base */}
      <path
        d="M6 38C6 38 10 37 40 37C70 37 74 38 74 38C75 39 74 42 72 42C56 42.5 24 42.5 8 42C6 42 5 39 6 38Z"
        stroke="#171717"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Trackpad notch */}
      <path d="M34 38H46" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/** Empty State 2: Hand-sketched Checkmark with Radial Rays */
export const SketchCheckEmpty: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Circular ring */}
      <circle cx="30" cy="30" r="18" stroke="#171717" strokeWidth="1.8" strokeLinecap="round" />
      {/* Checkmark */}
      <path d="M22 30L27 35L38 24" stroke="#171717" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Radial sunburst sketch rays */}
      <path d="M30 4V9" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 12L15 15" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M48 12L45 15" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/** Logo: Sketched Shield with pulse line */
export const SketchShieldLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M18 3L6 8V17C6 24.5 11.2 30.8 18 33C24.8 30.8 30 24.5 30 17V8L18 3Z"
        stroke="#171717"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#fcfbf8"
      />
      <path
        d="M10 18H14L16 13L20 23L22 18H26"
        stroke="#171717"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export {
  Calendar,
  ChevronDown,
  ArrowRight,
  Plus,
  Search,
  Filter,
  X,
  Terminal,
  UserCheck,
  Shield,
  Layers,
  Clock,
  ShieldCheck,
  Play,
};
