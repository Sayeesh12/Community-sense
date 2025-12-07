import request from 'supertest';
import createApp from '../src/app.js';
import User from '../src/models/User.js';

describe('Auth Routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should not register with duplicate email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        passwordHash: 'hashedpassword'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'password123' // Will be hashed by pre-save hook
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
    });
  });
});



