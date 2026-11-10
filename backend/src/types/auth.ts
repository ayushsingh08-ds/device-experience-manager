import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional().default('OPERATOR'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}
