const request = require('supertest');
const app = require('../src/app');
const { createUser } = require('./helpers');

describe('Auth', () => {
  test('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Nour Adel',
      email: 'nour@example.com',
      password: 'secret123',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('nour@example.com');
    expect(res.body.user.role).toBe('member');
    expect(res.body.user.password).toBeUndefined();
  });

  test('rejects registration when the password is too short', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Nour Adel',
      email: 'nour@example.com',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });

  test('rejects login with a wrong password', async () => {
    await createUser({ email: 'nour@example.com', password: 'secret123' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'nour@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('returns the logged in user from /me', async () => {
    const { token } = await createUser({ email: 'nour@example.com' });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('nour@example.com');
  });

  test('blocks protected routes without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});
