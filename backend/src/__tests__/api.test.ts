import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('DEM API Integration Test Suite', () => {
  let authToken: string;
  const testEmail = `operator_${Date.now()}@dem.local`;
  const testPassword = 'Password123!Secure';

  describe('GET /health (Liveness Probe)', () => {
    it('should return 200 OK with healthy status and uptime', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.timeStamp).toBeDefined();
    });
  });

  describe('Authentication Pipeline (/api/auth)', () => {
    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          name: 'Invalid User',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('should reject registration with short password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@dem.local',
          password: '123',
          name: 'Short Pass User',
        });

      expect(res.status).toBe(400);
    });

    it('should register a valid operator and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Test Operator',
          role: 'OPERATOR',
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('OPERATOR');
      authToken = res.body.token;
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Duplicate Operator',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });
  });

  describe('Device Fleet Security (/api/devices)', () => {
    it('should return 401 Unauthorized when accessing devices without token', async () => {
      const res = await request(app).get('/api/devices');
      expect(res.status).toBe(401);
    });

    it('should allow authenticated operator to view fleet devices', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('Telemetry Ingestion Pipeline (/api/telemetry)', () => {
    it('should reject telemetry for non-existent device with 404 Not Found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/telemetry')
        .send({
          deviceId: fakeUuid,
          cpuUsage: 45.0,
          memoryUsage: 60.0,
          diskUsage: 70.0,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Device not found');
    });

    it('should reject telemetry with out-of-range metrics (CPU > 100%)', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/telemetry')
        .send({
          deviceId: fakeUuid,
          cpuUsage: 150.0, // Invalid
          memoryUsage: 60.0,
          diskUsage: 70.0,
        });

      expect(res.status).toBe(400);
    });
  });
});
