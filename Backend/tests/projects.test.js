const request = require('supertest');
const app = require('../src/app');
const Project = require('../src/models/project');
const { createUser } = require('./helpers');

describe('Projects', () => {
  test('admin can create a project', async () => {
    const { token } = await createUser({ email: 'admin@example.com', role: 'admin' });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Website Redesign', description: 'New marketing site' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Website Redesign');
  });

  test('member cannot create a project', async () => {
    const { token } = await createUser({ email: 'sara@example.com' });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Website Redesign' });

    expect(res.status).toBe(403);
  });

  test('member only sees the projects they belong to', async () => {
    const { user: admin } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { user: sara, token } = await createUser({ email: 'sara@example.com' });

    await Project.create({ name: 'Shared project', owner: admin._id, members: [sara._id] });
    await Project.create({ name: 'Private project', owner: admin._id, members: [] });

    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe('Shared project');
  });

  test('paginates, sorts and searches projects', async () => {
    const { user: admin, token } = await createUser({ email: 'admin@example.com', role: 'admin' });
    await Project.create([
      { name: 'Alpha website', owner: admin._id },
      { name: 'Beta mobile app', owner: admin._id },
      { name: 'Gamma website', owner: admin._id },
    ]);

    const firstPage = await request(app)
      .get('/api/projects?limit=2&sort=name')
      .set('Authorization', `Bearer ${token}`);

    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.total).toBe(3);
    expect(firstPage.body.totalPages).toBe(2);
    expect(firstPage.body.items.map((project) => project.name)).toEqual(['Alpha website', 'Beta mobile app']);

    const secondPage = await request(app)
      .get('/api/projects?limit=2&page=2&sort=name')
      .set('Authorization', `Bearer ${token}`);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.items[0].name).toBe('Gamma website');

    const searched = await request(app)
      .get('/api/projects?search=website')
      .set('Authorization', `Bearer ${token}`);

    expect(searched.body.total).toBe(2);

    const badLimit = await request(app)
      .get('/api/projects?limit=500')
      .set('Authorization', `Bearer ${token}`);

    expect(badLimit.status).toBe(400);
  });

  test('member cannot open a project they are not part of', async () => {
    const { user: admin } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { token } = await createUser({ email: 'omar@example.com' });
    const project = await Project.create({ name: 'Private project', owner: admin._id });

    const res = await request(app)
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('admin can add and remove project members', async () => {
    const { user: admin, token } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { user: sara } = await createUser({ email: 'sara@example.com' });
    const project = await Project.create({ name: 'Website Redesign', owner: admin._id });

    const added = await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: sara._id });

    expect(added.status).toBe(200);
    expect(added.body.members).toHaveLength(1);

    const removed = await request(app)
      .delete(`/api/projects/${project._id}/members/${sara._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(removed.status).toBe(200);
    expect(removed.body.members).toHaveLength(0);
  });
});
