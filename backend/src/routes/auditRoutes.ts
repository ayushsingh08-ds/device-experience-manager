import { Router, Request, Response } from 'express';
import prisma from '../config/db';
import { authenticate, authorize } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

const AuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
});

router.use(authenticate);

// View audit logs (ADMIN, OPERATOR)
router.get('/', authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = AuditQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid Query Parameters', details: parseResult.error.format() });
      return;
    }

    const { page, limit, action } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.status(200).json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
