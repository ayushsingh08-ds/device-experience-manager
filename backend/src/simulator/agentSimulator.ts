import prisma from '../config/db';

const API_URL = process.env.API_URL || 'http://localhost:5000/api/telemetry';

// Random number generator between min and max with 2 decimal places
const getRandom = (min: number, max: number): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

export const sendDeviceTelemetry = async (deviceId: string, customMetrics?: { cpu?: number; memory?: number; disk?: number }) => {
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
    console.log(`[Agent ${deviceId}] Telemetry sent: CPU ${payload.cpuUsage}% | RAM ${payload.memoryUsage}% | DISK ${payload.diskUsage}%`);
    return data;
  } catch (error) {
    console.error(`[Agent ${deviceId}] Network error sending telemetry:`, error);
    return null;
  }
};

export const runFleetSimulation = async (intervalSeconds = 5, iterations = 3) => {
  console.log(`Starting Fleet Telemetry Simulator (Interval: ${intervalSeconds}s, Iterations: ${iterations})...`);

  const devices = await prisma.device.findMany({ select: { id: true, hostname: true } });
  if (devices.length === 0) {
    console.log('No devices enrolled in the database. Please enroll devices first.');
    return;
  }

  console.log(`Discovered ${devices.length} enrolled devices in fleet:`);
  devices.forEach((d) => console.log(` - ${d.hostname} (${d.id})`));

  let count = 0;
  const intervalId = setInterval(async () => {
    count++;
    console.log(`\n--- Telemetry Batch #${count} ---`);
    for (const d of devices) {
      await sendDeviceTelemetry(d.id);
    }

    if (iterations > 0 && count >= iterations) {
      clearInterval(intervalId);
      console.log('\nFleet telemetry simulation batch complete.');
      process.exit(0);
    }
  }, intervalSeconds * 1000);
};

// If run directly via tsx
if (require.main === module) {
  runFleetSimulation(3, 3).catch(console.error);
}
