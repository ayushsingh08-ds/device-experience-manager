import { Request, Response } from 'express';
import prisma from '../config/db';
import { z } from 'zod';

const AlertQuerySchema = z.object({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  deviceId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const UpdateAlertStatusSchema = z.object({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']),
});

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = AlertQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid Query Parameters', details: parseResult.error.format() });
      return;
    }

    const { status, severity, deviceId, page, limit } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (deviceId) where.deviceId = deviceId;

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          device: {
            select: { id: true, hostname: true, ipAddress: true, status: true },
          },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    res.status(200).json({
      data: alerts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch alerts error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateAlertStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const parseResult = UpdateAlertStatusSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.format() });
      return;
    }

    const { status } = parseResult.data;

    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });

    res.status(200).json({ message: 'Alert status updated successfully', alert: updated });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
