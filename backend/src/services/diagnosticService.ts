import prisma from '../config/db';
import { AlertSeverity } from '@prisma/client';

interface TelemetryMetrics {
  deviceId: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface DiagnosticRule {
  title: string;
  description: (value: number) => string;
  severity: AlertSeverity;
  condition: (m: TelemetryMetrics) => boolean;
  getValue: (m: TelemetryMetrics) => number;
}

const RULES: DiagnosticRule[] = [
  {
    title: 'High CPU Usage',
    description: (val) => `CPU utilization sustained at ${val}%, exceeding the 90% threshold.`,
    severity: 'HIGH',
    condition: (m) => m.cpuUsage >= 90.0,
    getValue: (m) => m.cpuUsage,
  },
  {
    title: 'Memory Pressure',
    description: (val) => `RAM usage reached ${val}%, exceeding the 85% threshold.`,
    severity: 'MEDIUM',
    condition: (m) => m.memoryUsage >= 85.0,
    getValue: (m) => m.memoryUsage,
  },
  {
    title: 'Low Disk Space',
    description: (val) => `Storage capacity at ${val}%, exceeding the 90% threshold.`,
    severity: 'CRITICAL',
    condition: (m) => m.diskUsage >= 90.0,
    getValue: (m) => m.diskUsage,
  },
];

export class DiagnosticService {
  /**
   * Evaluates incoming telemetry metrics against rules and creates alerts without duplicates
   */
  static async evaluateTelemetry(metrics: TelemetryMetrics): Promise<number> {
    let alertsCreated = 0;

    for (const rule of RULES) {
      if (rule.condition(metrics)) {
        const value = rule.getValue(metrics);

        // Check if an OPEN or ACKNOWLEDGED alert already exists for this device & rule
        const existingAlert = await prisma.alert.findFirst({
          where: {
            deviceId: metrics.deviceId,
            title: rule.title,
            status: { in: ['OPEN', 'ACKNOWLEDGED'] },
          },
        });

        if (!existingAlert) {
          await prisma.alert.create({
            data: {
              deviceId: metrics.deviceId,
              title: rule.title,
              description: rule.description(value),
              severity: rule.severity,
              status: 'OPEN',
            },
          });
          alertsCreated++;
          console.log(`[DiagnosticEngine] Alert created: [${rule.severity}] ${rule.title} on device ${metrics.deviceId}`);
        }
      }
    }

    return alertsCreated;
  }

  /**
   * Scans the fleet for devices that have not sent a heartbeat in the last X minutes
   */
  static async checkHeartbeatTimeouts(thresholdMinutes = 5): Promise<number> {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const timedOutDevices = await prisma.device.findMany({
      where: {
        status: { not: 'OFFLINE' },
        OR: [
          { lastHeartbeat: { lt: cutoff } },
          { lastHeartbeat: null },
        ],
      },
    });

    for (const d of timedOutDevices) {
      // Mark device OFFLINE
      await prisma.device.update({
        where: { id: d.id },
        data: { status: 'OFFLINE' },
      });

      // Ensure an alert exists
      const existingAlert = await prisma.alert.findFirst({
        where: {
          deviceId: d.id,
          title: 'Device Unavailable (Heartbeat Timeout)',
          status: { in: ['OPEN', 'ACKNOWLEDGED'] },
        },
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            deviceId: d.id,
            title: 'Device Unavailable (Heartbeat Timeout)',
            description: `No telemetry received for over ${thresholdMinutes} minutes. Device marked OFFLINE.`,
            severity: 'CRITICAL',
            status: 'OPEN',
          },
        });
      }
    }

    return timedOutDevices.length;
  }
}

