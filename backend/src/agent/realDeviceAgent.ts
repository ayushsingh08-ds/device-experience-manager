import prisma from '../config/db';
import { SystemMetricsService } from '../services/systemMetricsService';

const API_URL = process.env.API_URL || 'http://localhost:5000/api/telemetry';

export class RealDeviceAgent {
  private deviceId: string | null = null;
  private isRunning = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  /**
   * Discovers host identity and ensures the physical machine is registered in DEM.
   */
  async initialize(explicitDeviceId?: string): Promise<string> {
    if (explicitDeviceId || process.env.DEVICE_ID) {
      this.deviceId = explicitDeviceId || process.env.DEVICE_ID!;
      console.log(`✓ Using explicit Device ID: ${this.deviceId}`);
      return this.deviceId;
    }

    const identity = SystemMetricsService.getRealDeviceIdentity();
    console.log('\n======================================================');
    console.log('       DEM Physical Endpoint Agent Initializing       ');
    console.log('======================================================');
    console.log(` Hostname : ${identity.hostname}`);
    console.log(` OS       : ${identity.os} ${identity.osVersion}`);
    console.log(` IPv4     : ${identity.ipAddress}`);
    console.log(` MAC      : ${identity.macAddress}`);
    console.log('------------------------------------------------------');

    try {
      // Check if this real host is already enrolled in the DB
      let device = await prisma.device.findFirst({
        where: {
          OR: [
            { hostname: identity.hostname },
            { macAddress: identity.macAddress },
          ],
        },
      });

      if (device) {
        console.log(`✓ Existing host enrollment found in DEM: ${device.id}`);
        // Update IP/status to ensure latest network state is reflected
        device = await prisma.device.update({
          where: { id: device.id },
          data: {
            ipAddress: identity.ipAddress,
            status: 'ONLINE',
            lastHeartbeat: new Date(),
          },
        });
      } else {
        console.log('Registering physical host into DEM fleet inventory...');
        device = await prisma.device.create({
          data: {
            hostname: identity.hostname,
            ipAddress: identity.ipAddress,
            macAddress: identity.macAddress,
            os: identity.os,
            osVersion: identity.osVersion,
            status: 'ONLINE',
            lastHeartbeat: new Date(),
          },
        });

        // Compliance audit trail for real machine enrollment
        await prisma.auditLog.create({
          data: {
            action: 'PHYSICAL_DEVICE_AUTO_ENROLLED',
            resource: 'Device',
            resourceId: device.id,
            details: JSON.stringify(identity),
          },
        });

        console.log(`✓ Device registered with ID: ${device.id}`);
      }

      this.deviceId = device.id;
      return device.id;
    } catch (dbErr: any) {
      console.error('\n[Database Notice] Could not connect directly to Prisma DB:', dbErr.message || dbErr);
      console.log('Tip: Ensure Docker/PostgreSQL is running, or pass an existing enrolled ID via `--deviceId <uuid>`.');
      throw dbErr;
    }
  }

  /**
   * Samples live hardware metrics from the machine and posts to ingestion endpoint.
   */
  async sendPulse(): Promise<boolean> {
    if (!this.deviceId) {
      await this.initialize();
    }

    const metrics = await SystemMetricsService.getRealMetrics(400);

    const payload = {
      deviceId: this.deviceId,
      cpuUsage: metrics.cpuUsage,
      memoryUsage: metrics.memoryUsage,
      diskUsage: metrics.diskUsage,
      timestamp: metrics.timestamp,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[RealAgent] Ingestion failed (${response.status}):`, errorText);
        return false;
      }

      console.log(
        `[RealAgent ${new Date().toLocaleTimeString()}] Live Telemetry: ` +
        `CPU: ${metrics.cpuUsage.toFixed(1).padStart(5)}% | ` +
        `RAM: ${metrics.memoryUsage.toFixed(1).padStart(5)}% | ` +
        `Disk: ${metrics.diskUsage.toFixed(1).padStart(5)}%`
      );
      return true;
    } catch (err) {
      console.error('[RealAgent] Network error sending real telemetry:', err);
      return false;
    }
  }

  /**
   * Starts periodic sampling loop.
   */
  async start(intervalSeconds = 3, iterations = 0) {
    await this.initialize();
    this.isRunning = true;

    console.log(`\nStreaming live physical hardware telemetry every ${intervalSeconds}s...`);
    console.log('Press Ctrl+C to stop.\n');

    let count = 0;

    // Send first pulse immediately
    await this.sendPulse();
    count++;

    if (iterations > 0 && count >= iterations) {
      this.stop();
      return;
    }

    this.intervalTimer = setInterval(async () => {
      if (!this.isRunning) return;

      count++;
      await this.sendPulse();

      if (iterations > 0 && count >= iterations) {
        this.stop();
      }
    }, intervalSeconds * 1000);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    console.log('\n[RealAgent] Stopped hardware telemetry streaming.');
  }
}

// Direct CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let interval = 3;
  let iterations = 0; // 0 = continuous

  let explicitDeviceId: string | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--interval' && args[i + 1]) {
      interval = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--iterations' && args[i + 1]) {
      iterations = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--deviceId' && args[i + 1]) {
      explicitDeviceId = args[i + 1];
    }
  }

  const agent = new RealDeviceAgent();

  process.on('SIGINT', () => {
    agent.stop();
    process.exit(0);
  });

  agent.initialize(explicitDeviceId).then(() => {
    return agent.start(interval, iterations);
  }).catch((err) => {
    console.error('Fatal agent error:', err);
    process.exit(1);
  });
}
