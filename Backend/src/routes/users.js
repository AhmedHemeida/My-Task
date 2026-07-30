const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/', auth, adminOnly, async (req, res) => {
  const users = await User.find().sort('name');
  res.json(users);
});

module.exports = router;
