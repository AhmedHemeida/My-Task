const Project = require('../models/project');
const Task = require('../models/task');
const User = require('../models/user');
const { readPagination, readSort, searchFilter, paginated } = require('../query');

const SORTABLE = ['createdAt', 'name'];

exports.list = async (req, res) => {
  const visible =
    req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

  const search = searchFilter(req.query.search, ['name', 'description']);
  const filter = search ? { $and: [visible, search] } : visible;

  const { page, limit, skip } = readPagination(req.query);
  const sort = readSort(req.query.sort, SORTABLE, '-createdAt');

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  res.json(paginated(projects, total, page, limit));
};

exports.getOne = async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members', 'name email role');

  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!project.canAccess(req.user)) {
    return res.status(403).json({ message: 'You do not have access to this project' });
  }

  res.json(project);
};

exports.create = async (req, res) => {
  const { name, description, members } = req.body;

  const project = await Project.create({
    name,
    description,
    owner: req.user._id,
    members: members || [],
  });

  res.status(201).json(project);
};

exports.update = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const { name, description } = req.body;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  await project.save();

  res.json(project);
};

exports.remove = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ message: 'Project deleted' });
};

exports.addMember = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const user = await User.findById(req.body.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const alreadyMember = project.members.some((id) => String(id) === String(user._id));
  if (alreadyMember) {
    return res.status(409).json({ message: 'User is already a member of this project' });
  }

  project.members.push(user._id);
  await project.save();
  await project.populate('members', 'name email role');

  res.json(project);
};

exports.removeMember = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  project.members = project.members.filter((id) => String(id) !== req.params.userId);
  await project.save();
  await Task.updateMany(
    { project: project._id, assignee: req.params.userId },
    { assignee: null }
  );
  await project.populate('members', 'name email role');

  res.json(project);
};
