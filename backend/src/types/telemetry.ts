import { z } from 'zod';

export const IngestTelemetrySchema = z.object({
  deviceId: z.string().uuid('Invalid device ID format'),
  cpuUsage: z.number().min(0).max(100, 'CPU usage must be between 0 and 100'),
  memoryUsage: z.number().min(0).max(100, 'Memory usage must be between 0 and 100'),
  diskUsage: z.number().min(0).max(100, 'Disk usage must be between 0 and 100'),
  timestamp: z.string().datetime().optional(),
});

export const TelemetryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

export type IngestTelemetryInput = z.infer<typeof IngestTelemetrySchema>;
export type TelemetryQueryParams = z.infer<typeof TelemetryQuerySchema>;
