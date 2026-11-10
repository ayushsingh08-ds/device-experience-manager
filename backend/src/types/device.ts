import { z } from 'zod';

const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const RegisterDeviceSchema = z.object({
  hostname: z.string().min(1, 'Hostname is required').max(100),
  ipAddress: z.string().regex(IPV4_REGEX, 'Invalid IPv4 address format (e.g. 192.168.1.10)'),
  macAddress: z.string().regex(MAC_REGEX, 'Invalid MAC address format (e.g. 00:1A:2B:3C:4D:5E)'),
  os: z.string().min(1, 'Operating system is required').max(50),
  osVersion: z.string().min(1, 'OS version is required').max(50),
});

export const UpdateDeviceSchema = z.object({
  hostname: z.string().min(1).max(100).optional(),
  ipAddress: z.string().regex(IPV4_REGEX, 'Invalid IPv4 address format').optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED']).optional(),
});

export const DeviceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED']).optional(),
  search: z.string().optional(),
});

export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
export type DeviceQueryParams = z.infer<typeof DeviceQuerySchema>;
