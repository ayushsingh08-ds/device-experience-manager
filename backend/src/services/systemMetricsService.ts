import os from 'os';
import fs from 'fs';

export interface RealMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  timestamp: string;
}

export interface RealDeviceIdentity {
  hostname: string;
  ipAddress: string;
  macAddress: string;
  os: string;
  osVersion: string;
}

interface CpuSnapshot {
  idle: number;
  total: number;
}

const sampleCpuSnapshot = (): CpuSnapshot => {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const [type, ticks] of Object.entries(cpu.times)) {
      total += ticks;
      if (type === 'idle') {
        idle += ticks;
      }
    }
  }

  return { idle, total };
};

export class SystemMetricsService {
  /**
   * Samples live CPU, RAM, and Disk metrics from the physical host machine.
   * Uses non-blocking sampling window for accurate CPU utilization calculation.
   */
  static async getRealMetrics(sampleWindowMs = 400): Promise<RealMetrics> {
    const startCpu = sampleCpuSnapshot();

    // Sample window wait
    await new Promise((resolve) => setTimeout(resolve, sampleWindowMs));

    const endCpu = sampleCpuSnapshot();
    const idleDelta = endCpu.idle - startCpu.idle;
    const totalDelta = endCpu.total - startCpu.total;

    let cpuUsage = 0;
    if (totalDelta > 0) {
      cpuUsage = parseFloat(((1 - idleDelta / totalDelta) * 100).toFixed(2));
    }

    // 2. Real RAM Usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = parseFloat((((totalMemory - freeMemory) / totalMemory) * 100).toFixed(2));

    // 3. Real Disk Usage
    let diskUsage = 0;
    try {
      const rootPath = process.platform === 'win32' ? `${process.cwd().split(':')[0]}:\\` : '/';
      const stats = await fs.promises.statfs(rootPath);
      const totalBytes = stats.bsize * stats.blocks;
      const freeBytes = stats.bsize * stats.bfree;
      const usedBytes = totalBytes - freeBytes;
      if (totalBytes > 0) {
        diskUsage = parseFloat(((usedBytes / totalBytes) * 100).toFixed(2));
      }
    } catch (err) {
      console.warn('[SystemMetricsService] Could not sample real disk with statfs, fallback to 0:', err);
    }

    return {
      cpuUsage: Math.max(0, Math.min(100, cpuUsage)),
      memoryUsage: Math.max(0, Math.min(100, memoryUsage)),
      diskUsage: Math.max(0, Math.min(100, diskUsage)),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Inspects host OS to get real hardware identity, IP, and MAC address.
   */
  static getRealDeviceIdentity(): RealDeviceIdentity {
    const hostname = os.hostname();
    const nets = os.networkInterfaces();

    let ipAddress = '127.0.0.1';
    let macAddress = '00:00:00:00:00:00';

    // Search for first non-internal IPv4 adapter (Wi-Fi, Ethernet)
    for (const name of Object.keys(nets)) {
      const adapters = nets[name];
      if (!adapters) continue;
      for (const net of adapters) {
        if (net.family === 'IPv4' && !net.internal) {
          ipAddress = net.address;
          if (net.mac && net.mac !== '00:00:00:00:00:00') {
            macAddress = net.mac.toUpperCase();
          }
          break;
        }
      }
      if (ipAddress !== '127.0.0.1') break;
    }

    // Format readable OS string
    let osName = 'Linux';
    if (process.platform === 'win32') {
      osName = 'Windows';
    } else if (process.platform === 'darwin') {
      osName = 'macOS';
    }

    const osVersion = `${os.release()} (${os.arch()})`;

    return {
      hostname,
      ipAddress,
      macAddress,
      os: osName,
      osVersion,
    };
  }
}
