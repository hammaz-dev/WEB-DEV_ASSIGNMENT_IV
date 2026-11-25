const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const appEvents = require('../events/appEvents');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken); // every notes route is protected

const validId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: 'Invalid note id' });
  next();
};

// Users only touch their own notes; admins may touch any.
const canAccess = (note, user) => user.role === 'admin' || note.owner.toString() === user.id;

// CREATE
router.post('/', async (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).json({ message: 'title and content are required' });

  const note = await Note.create({ title, content, owner: req.user.id });
  appEvents.emit('note:created', note);
  res.status(201).json(note);
});

// READ all (own notes; admin can pass ?all=true to see everyone's)
router.get('/', async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { owner: req.user.id };
  const notes = await Note.find(filter).sort({ createdAt: 1 });
  res.status(200).json(notes);
});

// READ one
router.get('/:id', validId, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (!canAccess(note, req.user)) return res.status(403).json({ message: 'Not your note' });
  res.json(note);
});

// UPDATE
router.put('/:id', validId, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (!canAccess(note, req.user)) return res.status(403).json({ message: 'Not your note' });

  const { title, content } = req.body || {};
  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  await note.save();

  appEvents.emit('note:updated', note);
  res.json(note);
});

// DELETE
router.delete('/:id', validId, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (!canAccess(note, req.user)) return res.status(403).json({ message: 'Not your note' });

  await note.deleteOne();
  appEvents.emit('note:deleted', req.params.id);
  res.json({ message: 'Note deleted' });
});

module.exports = router;
