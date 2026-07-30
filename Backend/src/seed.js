require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const User = require('./models/user');
const Project = require('./models/project');
const Task = require('./models/task');

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  await Task.deleteMany();
  await Project.deleteMany();
  await User.deleteMany();

  const [admin, sara, omar] = await User.create([
    { name: 'Admin User', email: 'admin@taskmanager.com', password: 'Admin123', role: 'admin' },
    { name: 'Sara Ali', email: 'sara@taskmanager.com', password: 'Member123', role: 'member' },
    { name: 'Omar Hassan', email: 'omar@taskmanager.com', password: 'Member123', role: 'member' },
  ]);

  const website = await Project.create({
    name: 'Website Redesign',
    description: 'Rebuild the marketing website with a new design system.',
    owner: admin._id,
    members: [sara._id, omar._id],
  });

  const mobile = await Project.create({
    name: 'Mobile App',
    description: 'Ship the first version of the customer mobile app.',
    owner: admin._id,
    members: [sara._id],
  });

  await Task.create([
    {
      title: 'Design the new landing page',
      description: 'Prepare desktop and mobile mockups for the hero section.',
      status: 'In Progress',
      priority: 'High',
      dueDate: daysFromNow(3),
      project: website._id,
      creator: admin._id,
      assignee: sara._id,
    },
    {
      title: 'Migrate blog content',
      description: 'Move the existing articles to the new CMS structure.',
      status: 'Todo',
      priority: 'Medium',
      dueDate: daysFromNow(10),
      project: website._id,
      creator: admin._id,
      assignee: omar._id,
    },
    {
      title: 'Set up analytics',
      description: 'Add page view and conversion tracking.',
      status: 'Done',
      priority: 'Low',
      dueDate: daysFromNow(-2),
      project: website._id,
      creator: sara._id,
      assignee: sara._id,
    },
    {
      title: 'Build the login screen',
      description: 'Email and password login with validation messages.',
      status: 'Todo',
      priority: 'High',
      dueDate: daysFromNow(5),
      project: mobile._id,
      creator: admin._id,
      assignee: sara._id,
    },
    {
      title: 'Prepare the release checklist',
      description: 'List everything needed before submitting to the app stores.',
      status: 'Todo',
      priority: 'Medium',
      dueDate: daysFromNow(14),
      project: mobile._id,
      creator: admin._id,
      assignee: null,
    },
  ]);

  console.log('Seed data created');
  console.log('Admin  -> admin@taskmanager.com / Admin123');
  console.log('Member -> sara@taskmanager.com / Member123');
  console.log('Member -> omar@taskmanager.com / Member123');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seeding failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
