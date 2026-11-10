import { Request, Response } from 'express';
import prisma from '../config/db';
import { IngestTelemetrySchema, TelemetryQuerySchema } from '../types/telemetry';
import { DiagnosticService } from '../services/diagnosticService';

export const ingestTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = IngestTelemetrySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.format() });
      return;
    }

    const { deviceId, cpuUsage, memoryUsage, diskUsage, timestamp } = parseResult.data;

    // Verify device exists
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      res.status(404).json({ error: 'Device not found or not enrolled.' });
      return;
    }

    const eventTime = timestamp ? new Date(timestamp) : new Date();

    // Atomic transaction: store telemetry + update device heartbeat & online status
    const [telemetryRecord] = await prisma.$transaction([
      prisma.telemetry.create({
        data: {
          deviceId,
          cpuUsage,
          memoryUsage,
          diskUsage,
          timestamp: eventTime,
        },
      }),
      prisma.device.update({
        where: { id: deviceId },
        data: {
          lastHeartbeat: eventTime,
          status: 'ONLINE',
        },
      }),
    ]);

    // Asynchronously run diagnostic rules to evaluate alerts (non-blocking)
    DiagnosticService.evaluateTelemetry({
      deviceId,
      cpuUsage,
      memoryUsage,
      diskUsage,
    }).catch((err) => console.error('[DiagnosticEngine Error]:', err));

    res.status(201).json({
      message: 'Telemetry ingested successfully',
      telemetryId: telemetryRecord.id,
      timestamp: telemetryRecord.timestamp,
    });
  } catch (error) {
    console.error('Telemetry ingestion error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getDeviceTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = String(req.params.deviceId);
    const parseResult = TelemetryQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid Query Parameters', details: parseResult.error.format() });
      return;
    }

    const { limit } = parseResult.data;

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const records = await prisma.telemetry.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    res.status(200).json({
      deviceId,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Fetch telemetry error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
