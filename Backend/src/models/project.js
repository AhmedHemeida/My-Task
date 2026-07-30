const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

projectSchema.methods.canAccess = function (user) {
  if (user.role === 'admin') return true;
  const allowed = [this.owner, ...this.members].map((entry) => String(entry._id || entry));
  return allowed.includes(String(user._id));
};

module.exports = mongoose.model('Project', projectSchema);
