import prisma from '../config/db';
import { SystemMetricsService } from '../services/systemMetricsService';

const API_URL = process.env.API_URL || 'http://localhost:5000/api/telemetry';

// Random fallback generator
const getRandom = (min: number, max: number): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

export const sendDeviceTelemetry = async (
  deviceId: string,
  customMetrics?: { cpu?: number; memory?: number; disk?: number }
) => {
  const payload = {
    deviceId,
    cpuUsage: customMetrics?.cpu ?? getRandom(15, 75),
    memoryUsage: customMetrics?.memory ?? getRandom(40, 85),
    diskUsage: customMetrics?.disk ?? getRandom(50, 80),
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Agent ${deviceId}] Ingestion failed with status ${response.status}:`, err);
      return null;
    }

    const data = await response.json();
    console.log(
      `[Agent ${deviceId}] Telemetry sent: CPU ${payload.cpuUsage}% | RAM ${payload.memoryUsage}% | DISK ${payload.diskUsage}%`
    );
    return data;
  } catch (error) {
    console.error(`[Agent ${deviceId}] Network error sending telemetry:`, error);
    return null;
  }
};

export const runFleetSimulation = async (
  intervalSeconds = 3,
  iterations = 3,
  useRealMetrics = false
) => {
  console.log(
    `Starting Fleet Telemetry ${useRealMetrics ? '(Using REAL Host Hardware Metrics)' : '(Synthetic Mode)'} (Interval: ${intervalSeconds}s, Iterations: ${iterations})...`
  );

  const devices = await prisma.device.findMany({ select: { id: true, hostname: true } });
  if (devices.length === 0) {
    console.log('No devices enrolled in the database. Please enroll devices first.');
    return;
  }

  console.log(`Discovered ${devices.length} enrolled devices in fleet:`);
  devices.forEach((d) => console.log(` - ${d.hostname} (${d.id})`));

  let count = 0;
  const runBatch = async () => {
    count++;
    console.log(`\n--- Telemetry Batch #${count} ---`);

    // Sample real hardware metrics if requested
    let realMetrics: { cpu: number; memory: number; disk: number } | undefined;
    if (useRealMetrics) {
      const sampled = await SystemMetricsService.getRealMetrics(400);
      realMetrics = {
        cpu: sampled.cpuUsage,
        memory: sampled.memoryUsage,
        disk: sampled.diskUsage,
      };
      console.log(`[Host Hardware Sample] Real CPU: ${realMetrics.cpu}% | Real RAM: ${realMetrics.memory}% | Real Disk: ${realMetrics.disk}%`);
    }

    for (const d of devices) {
      await sendDeviceTelemetry(d.id, realMetrics);
    }

    if (iterations > 0 && count >= iterations) {
      clearInterval(intervalId);
      console.log('\nFleet telemetry simulation batch complete.');
      process.exit(0);
    }
  };

  const intervalId = setInterval(runBatch, intervalSeconds * 1000);
  // Run first batch immediately
  await runBatch();
};

// If run directly via tsx
if (require.main === module) {
  const args = process.argv.slice(2);
  let interval = 3;
  let iterations = 3;
  let useRealMetrics = args.includes('--real') || process.env.USE_REAL_METRICS === 'true';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--interval' && args[i + 1]) {
      interval = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--iterations' && args[i + 1]) {
      iterations = parseInt(args[i + 1], 10);
    }
  }

  runFleetSimulation(interval, iterations, useRealMetrics).catch(console.error);
}
