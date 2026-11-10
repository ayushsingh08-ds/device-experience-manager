import { Request, Response } from 'express';
import prisma from '../config/db';
import { RegisterDeviceSchema, UpdateDeviceSchema, DeviceQuerySchema } from '../types/device';

export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = RegisterDeviceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.format() });
      return;
    }

    const { hostname, ipAddress, macAddress, os, osVersion } = parseResult.data;

    // Check if device with hostname or MAC address already enrolled
    const existing = await prisma.device.findFirst({
      where: {
        OR: [{ hostname }, { macAddress }],
      },
    });

    if (existing) {
      res.status(409).json({
        error: 'Conflict: A device with this hostname or MAC address is already enrolled.',
      });
      return;
    }

    const device = await prisma.device.create({
      data: {
        hostname,
        ipAddress,
        macAddress,
        os,
        osVersion,
        status: 'ONLINE',
        lastHeartbeat: new Date(),
      },
    });

    // Record audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'DEVICE_ENROLLED',
          resource: 'Device',
          resourceId: device.id,
          details: JSON.stringify({ hostname, ipAddress, macAddress }),
          ipAddress: req.ip ?? null,
        },
      });
    }

    res.status(201).json({
      message: 'Device enrolled successfully',
      device,
    });
  } catch (error) {
    console.error('Device enrollment error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = DeviceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid Query Parameters', details: parseResult.error.format() });
      return;
    }

    const { page, limit, status, search } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { hostname: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search } },
      ];
    }

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              alerts: { where: { status: 'OPEN' } },
            },
          },
        },
      }),
      prisma.device.count({ where }),
    ]);

    res.status(200).json({
      data: devices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch devices error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        telemetry: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
        alerts: {
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.status(200).json({ device });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const parseResult = UpdateDeviceSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.format() });
      return;
    }

    const existing = await prisma.device.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const updated = await prisma.device.update({
      where: { id },
      data: parseResult.data,
    });

    res.status(200).json({ message: 'Device updated successfully', device: updated });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.device.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    await prisma.device.delete({ where: { id } });

    // Record audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'DEVICE_DECOMMISSIONED',
          resource: 'Device',
          resourceId: id,
          details: JSON.stringify({ hostname: existing.hostname, macAddress: existing.macAddress }),
          ipAddress: req.ip ?? null,
        },
      });
    }

    res.status(200).json({ message: 'Device decommissioned successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
