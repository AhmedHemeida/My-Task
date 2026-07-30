const request = require('supertest');
const app = require('../src/app');
const Project = require('../src/models/project');
const Task = require('../src/models/task');
const { createUser } = require('./helpers');

describe('Tasks', () => {
  test('a project member can create a task', async () => {
    const { user: admin } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { user: sara, token } = await createUser({ email: 'sara@example.com' });
    const project = await Project.create({ name: 'Website', owner: admin._id, members: [sara._id] });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Design the landing page',
        project: project._id,
        priority: 'High',
        assignee: sara._id,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Todo');
    expect(res.body.assignee.email).toBe('sara@example.com');
    expect(res.body.creator.email).toBe('sara@example.com');
  });

  test('rejects a task created in a project the user has no access to', async () => {
    const { user: admin } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { token } = await createUser({ email: 'omar@example.com' });
    const project = await Project.create({ name: 'Private', owner: admin._id });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Sneaky task', project: project._id });

    expect(res.status).toBe(403);
    await expect(Task.countDocuments()).resolves.toBe(0);
  });

  test('rejects an assignee who is not part of the project', async () => {
    const { user: admin, token } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { user: omar } = await createUser({ email: 'omar@example.com' });
    const project = await Project.create({ name: 'Website', owner: admin._id, members: [] });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write the docs', project: project._id, assignee: omar._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Assignee must have access to this project');
  });

  test('filters tasks by status, priority and assignee', async () => {
    const { user: admin, token } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { user: sara } = await createUser({ email: 'sara@example.com' });
    const project = await Project.create({ name: 'Website', owner: admin._id, members: [sara._id] });

    await Task.create([
      { title: 'Todo high for sara', status: 'Todo', priority: 'High', project: project._id, creator: admin._id, assignee: sara._id },
      { title: 'Done high for sara', status: 'Done', priority: 'High', project: project._id, creator: admin._id, assignee: sara._id },
      { title: 'Todo low for admin', status: 'Todo', priority: 'Low', project: project._id, creator: admin._id, assignee: admin._id },
    ]);

    const byStatus = await request(app)
      .get(`/api/tasks?project=${project._id}&status=Todo`)
      .set('Authorization', `Bearer ${token}`);
    expect(byStatus.body.items).toHaveLength(2);

    const byPriority = await request(app)
      .get(`/api/tasks?project=${project._id}&status=Todo&priority=High`)
      .set('Authorization', `Bearer ${token}`);
    expect(byPriority.body.items).toHaveLength(1);
    expect(byPriority.body.items[0].title).toBe('Todo high for sara');

    const byAssignee = await request(app)
      .get(`/api/tasks?project=${project._id}&assignee=${sara._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(byAssignee.body.items).toHaveLength(2);
  });

  test('paginates, sorts and searches tasks', async () => {
    const { user: admin, token } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const project = await Project.create({ name: 'Website', owner: admin._id });

    await Task.create([
      { title: 'Write the docs', project: project._id, creator: admin._id, dueDate: new Date('2026-03-01') },
      { title: 'Review the docs', project: project._id, creator: admin._id, dueDate: new Date('2026-01-01') },
      { title: 'Ship the release', project: project._id, creator: admin._id, dueDate: new Date('2026-02-01') },
    ]);

    const sorted = await request(app)
      .get(`/api/tasks?project=${project._id}&sort=dueDate`)
      .set('Authorization', `Bearer ${token}`);

    expect(sorted.body.items.map((task) => task.title)).toEqual([
      'Review the docs',
      'Ship the release',
      'Write the docs',
    ]);

    const paged = await request(app)
      .get(`/api/tasks?project=${project._id}&sort=dueDate&limit=1&page=2`)
      .set('Authorization', `Bearer ${token}`);

    expect(paged.body.items).toHaveLength(1);
    expect(paged.body.items[0].title).toBe('Ship the release');
    expect(paged.body.total).toBe(3);
    expect(paged.body.totalPages).toBe(3);

    const searched = await request(app)
      .get(`/api/tasks?project=${project._id}&search=docs`)
      .set('Authorization', `Bearer ${token}`);

    expect(searched.body.total).toBe(2);

    const unknownSort = await request(app)
      .get(`/api/tasks?project=${project._id}&sort=hackme`)
      .set('Authorization', `Bearer ${token}`);

    expect(unknownSort.status).toBe(200);
    expect(unknownSort.body.items).toHaveLength(3);
  });

  test('a project member cannot delete a task created by someone else', async () => {
    const { user: admin } = await createUser({ email: 'admin@example.com', role: 'admin' });
    const { user: sara, token: saraToken } = await createUser({ email: 'sara@example.com' });
    const { user: omar, token: omarToken } = await createUser({ email: 'omar@example.com' });
    const project = await Project.create({
      name: 'Website',
      owner: admin._id,
      members: [sara._id, omar._id],
    });
    const task = await Task.create({ title: 'Ship it', project: project._id, creator: sara._id });

    const forbidden = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${omarToken}`);

    expect(forbidden.status).toBe(403);
    await expect(Task.countDocuments()).resolves.toBe(1);

    const deleted = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${saraToken}`);

    expect(deleted.status).toBe(200);
    await expect(Task.countDocuments()).resolves.toBe(0);
  });
});
