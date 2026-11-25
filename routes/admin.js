const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Note = require('../models/Note');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, authorizeRoles('admin')); // RBAC: admins only

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: 1 });
  res.json(users);
});

// DELETE /api/admin/users/:id  (also removes that user's notes)
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });
  if (id === req.user.id) return res.status(400).json({ message: 'Admins cannot delete themselves' });

  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await Note.deleteMany({ owner: id });
  res.json({ message: 'User and their notes deleted' });
});

module.exports = router;
