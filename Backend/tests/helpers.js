const jwt = require('jsonwebtoken');
const User = require('../src/models/user');

async function createUser({ name = 'Test User', email, password = 'secret123', role = 'member' }) {
  const user = await User.create({ name, email, password, role });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return { user, token };
}

module.exports = { createUser };
