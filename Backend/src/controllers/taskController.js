const Task = require('../models/task');
const Project = require('../models/project');
const User = require('../models/user');
const { readPagination, readSort, searchFilter, paginated } = require('../query');

const SORTABLE = ['createdAt', 'dueDate', 'title', 'status'];

async function findTaskWithProject(taskId) {
  const task = await Task.findById(taskId);
  if (!task) return {};
  const project = await Project.findById(task.project);
  return { task, project };
}

async function isValidAssignee(project, assigneeId) {
  const user = await User.findById(assigneeId);
  return Boolean(user) && project.canAccess(user);
}

exports.list = async (req, res) => {
  const { project, status, priority, assignee } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;

  if (project) {
    const found = await Project.findById(project);
    if (!found) return res.status(404).json({ message: 'Project not found' });
    if (!found.canAccess(req.user)) {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }
    filter.project = found._id;
  } else if (req.user.role !== 'admin') {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    filter.project = { $in: projects.map((item) => item._id) };
  }

  const search = searchFilter(req.query.search, ['title', 'description']);
  const query = search ? { $and: [filter, search] } : filter;

  const { page, limit, skip } = readPagination(req.query);
  const sort = readSort(req.query.sort, SORTABLE, '-createdAt');

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate('creator', 'name email')
      .populate('assignee', 'name email')
      .populate('project', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Task.countDocuments(query),
  ]);

  res.json(paginated(tasks, total, page, limit));
};

exports.getOne = async (req, res) => {
  const { task, project } = await findTaskWithProject(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (!project.canAccess(req.user)) {
    return res.status(403).json({ message: 'You do not have access to this task' });
  }

  await task.populate([
    { path: 'creator', select: 'name email' },
    { path: 'assignee', select: 'name email' },
  ]);

  res.json(task);
};

exports.create = async (req, res) => {
  const { title, description, status, priority, dueDate, assignee } = req.body;

  const project = await Project.findById(req.body.project);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!project.canAccess(req.user)) {
    return res.status(403).json({ message: 'You do not have access to this project' });
  }

  if (assignee && !(await isValidAssignee(project, assignee))) {
    return res.status(400).json({ message: 'Assignee must have access to this project' });
  }

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate: dueDate || null,
    project: project._id,
    creator: req.user._id,
    assignee: assignee || null,
  });

  await task.populate([
    { path: 'creator', select: 'name email' },
    { path: 'assignee', select: 'name email' },
  ]);

  res.status(201).json(task);
};

exports.update = async (req, res) => {
  const { task, project } = await findTaskWithProject(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (!project.canAccess(req.user)) {
    return res.status(403).json({ message: 'You do not have access to this task' });
  }

  const { title, description, status, priority, dueDate, assignee } = req.body;

  if (assignee && !(await isValidAssignee(project, assignee))) {
    return res.status(400).json({ message: 'Assignee must have access to this project' });
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate || null;
  if (assignee !== undefined) task.assignee = assignee || null;

  await task.save();
  await task.populate([
    { path: 'creator', select: 'name email' },
    { path: 'assignee', select: 'name email' },
  ]);

  res.json(task);
};

exports.remove = async (req, res) => {
  const { task, project } = await findTaskWithProject(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (!project.canAccess(req.user)) {
    return res.status(403).json({ message: 'You do not have access to this task' });
  }

  const isCreator = String(task.creator) === String(req.user._id);
  if (req.user.role !== 'admin' && !isCreator) {
    return res.status(403).json({ message: 'Only the creator or an admin can delete this task' });
  }

  await task.deleteOne();
  res.json({ message: 'Task deleted' });
};
