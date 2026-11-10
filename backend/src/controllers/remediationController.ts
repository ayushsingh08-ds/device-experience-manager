import { Request, Response } from 'express';
import prisma from '../config/db';
import { z } from 'zod';

const CreateRemediationSchema = z.object({
  deviceId: z.string().uuid(),
  alertId: z.string().uuid().optional(),
  actionType: z.enum([
    'CLEANUP_TEMP_FILES',
    'RESTART_BACKGROUND_SERVICE',
    'RETRY_FAILED_UPDATES',
    'RESET_NETWORK_ADAPTER',
  ]),
});

const RemediationQuerySchema = z.object({
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTING', 'COMPLETED', 'FAILED']).optional(),
  deviceId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createRemediation = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = CreateRemediationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.format() });
      return;
    }

    const { deviceId, alertId, actionType } = parseResult.data;

    // Verify device
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const remediation = await prisma.remediationAction.create({
      data: {
        deviceId,
        alertId,
        actionType,
        status: 'PENDING_APPROVAL',
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'REMEDIATION_REQUESTED',
          resource: 'RemediationAction',
          resourceId: remediation.id,
          details: JSON.stringify({ deviceId, actionType }),
          ipAddress: req.ip ?? null,
        },
      });
    }

    res.status(201).json({
      message: 'Remediation action created and awaiting administrator approval',
      remediation,
    });
  } catch (error) {
    console.error('Create remediation error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getRemediations = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = RemediationQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid Query Parameters', details: parseResult.error.format() });
      return;
    }

    const { status, deviceId, page, limit } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (deviceId) where.deviceId = deviceId;

    const [remediations, total] = await Promise.all([
      prisma.remediationAction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          device: { select: { id: true, hostname: true, status: true } },
          alert: { select: { id: true, title: true, severity: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.remediationAction.count({ where }),
    ]);

    res.status(200).json({
      data: remediations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch remediations error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const approveAndExecute = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const remediation = await prisma.remediationAction.findUnique({
      where: { id },
      include: { device: true },
    });

    if (!remediation) {
      res.status(404).json({ error: 'Remediation action not found' });
      return;
    }

    // State machine check: prevent re-executing already approved/completed actions
    if (remediation.status !== 'PENDING_APPROVAL') {
      res.status(409).json({
        error: `Conflict: Cannot approve remediation in '${remediation.status}' state. Only 'PENDING_APPROVAL' actions can be executed.`,
      });
      return;
    }

    // Set state to EXECUTING
    await prisma.remediationAction.update({
      where: { id },
      data: {
        status: 'EXECUTING',
        executedBy: req.user?.userId ?? null,
      },
    });

    // Run simulated execution
    const timestamp = new Date().toISOString();
    const simulatedLogs: Record<string, string> = {
      CLEANUP_TEMP_FILES: `[${timestamp}] [Agent Simulation] Scanned /tmp and C:\\Windows\\Temp. Cleared 2.4 GB of unreferenced cached files. Exit code: 0 (Success).`,
      RESTART_BACKGROUND_SERVICE: `[${timestamp}] [Agent Simulation] Terminated high-consumption background worker. Restarted service daemon. Memory footprint normalized. Exit code: 0 (Success).`,
      RETRY_FAILED_UPDATES: `[${timestamp}] [Agent Simulation] Verified package catalog integrity. Successfully applied patch build 22631.4000. Exit code: 0 (Success).`,
      RESET_NETWORK_ADAPTER: `[${timestamp}] [Agent Simulation] Flushed DNS cache. Re-initialized virtual network interface. Gateway ping 1.2ms. Exit code: 0 (Success).`,
    };

    const outputLog = simulatedLogs[remediation.actionType] || `[${timestamp}] Execution completed successfully.`;

    // Complete action
    const completed = await prisma.remediationAction.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        outputLog,
      },
    });

    // If an alert was tied to this remediation, auto-resolve it!
    if (remediation.alertId) {
      await prisma.alert.update({
        where: { id: remediation.alertId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });
    }

    // Record audit trail
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'REMEDIATION_EXECUTED',
          resource: 'RemediationAction',
          resourceId: id,
          details: JSON.stringify({ actionType: remediation.actionType, result: 'COMPLETED' }),
          ipAddress: req.ip ?? null,
        },
      });
    }

    res.status(200).json({
      message: 'Remediation approved and executed successfully',
      remediation: completed,
    });
  } catch (error) {
    console.error('Execute remediation error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const rejectRemediation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const remediation = await prisma.remediationAction.findUnique({ where: { id } });
    if (!remediation) {
      res.status(404).json({ error: 'Remediation action not found' });
      return;
    }

    if (remediation.status !== 'PENDING_APPROVAL') {
      res.status(409).json({
        error: `Conflict: Cannot reject remediation in '${remediation.status}' state.`,
      });
      return;
    }

    const updated = await prisma.remediationAction.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'REMEDIATION_REJECTED',
          resource: 'RemediationAction',
          resourceId: id,
          ipAddress: req.ip ?? null,
        },
      });
    }

    res.status(200).json({ message: 'Remediation rejected', remediation: updated });
  } catch (error) {
    console.error('Reject remediation error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
