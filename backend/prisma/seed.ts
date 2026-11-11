import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with fresh test environment...');

  // 1. Create Admin User
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Ayush Singh',
      email: 'admin@dem.local',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin User created: ${user.name} (${user.email})`);

  // 2. Create Enrolled Device
  const device = await prisma.device.create({
    data: {
      hostname: 'LAPTOP-ENG-042',
      ipAddress: '192.168.1.105',
      macAddress: '00:1A:2B:3C:4D:5E',
      os: 'Windows 11 Enterprise',
      osVersion: '23H2 (Build 22631.3880)',
      status: 'ONLINE',
      lastHeartbeat: new Date(),
    },
  });
  console.log(`✓ Device enrolled: ${device.hostname} [${device.id}]`);

  // 3. Create Sample Telemetry Pulses
  const now = Date.now();
  for (let i = 4; i >= 0; i--) {
    await prisma.telemetry.create({
      data: {
        deviceId: device.id,
        cpuUsage: 45 + Math.sin(i) * 20,
        memoryUsage: 65 + Math.cos(i) * 10,
        diskUsage: 72.4,
        timestamp: new Date(now - i * 10000),
      },
    });
  }
  console.log('✓ 5 Historical telemetry records seeded');

  // 4. Create an Open Alert
  const alert = await prisma.alert.create({
    data: {
      deviceId: device.id,
      title: 'High CPU Usage',
      description: 'CPU utilization reached 92.4%, exceeding the 90% threshold.',
      severity: 'HIGH',
      status: 'OPEN',
    },
  });
  console.log(`✓ Open alert created: ${alert.title} [${alert.severity}]`);

  // 5. Create Audit Trail
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DEVICE_ENROLLED',
      resource: 'Device',
      resourceId: device.id,
      details: JSON.stringify({ hostname: device.hostname, ipAddress: device.ipAddress }),
    },
  });
  console.log('✓ Initial compliance audit log created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
