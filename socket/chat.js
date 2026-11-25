const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const appEvents = require('../events/appEvents');
const { extractToken } = require('../middleware/auth');

const DEFAULT_ROOM = 'general';

module.exports = function initChat(io) {
  // Socket authentication: reject connections without a valid JWT.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || extractToken(socket.handshake.headers);
    if (!token) return next(new Error('No token provided'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { username } = socket.user;
    console.log(`User connected: ${socket.id}`);

    const joinRoom = async (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
      socket.emit('joinedRoom', room);
      socket.to(room).emit('systemMessage', { room, text: `${username} joined` });

      const history = await Message.find({ room }).sort({ createdAt: -1 }).limit(30);
      socket.emit('history', { room, messages: history.reverse() });
    };

    await joinRoom(DEFAULT_ROOM);

    socket.on('joinRoom', (room) => {
      if (typeof room === 'string' && room.trim()) joinRoom(room.trim().toLowerCase());
    });

    socket.on('leaveRoom', (room) => {
      socket.leave(room);
      socket.to(room).emit('systemMessage', { room, text: `${username} left` });
    });

    socket.on('chatMessage', async ({ room = DEFAULT_ROOM, text } = {}) => {
      if (typeof text !== 'string' || !text.trim()) return;
      if (!socket.rooms.has(room)) return; // must be in the room to talk in it

      const saved = await Message.create({
        room,
        sender: socket.user.id,
        username,
        text: text.trim().slice(0, 1000),
      });

      appEvents.emit('chat:message', { room, username, text: saved.text });
      io.to(room).emit('chatMessage', {
        room,
        username,
        text: saved.text,
        createdAt: saved.createdAt,
      });
    });

    socket.on('typing', (room = DEFAULT_ROOM) => {
      socket.to(room).emit('typing', { room, username });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
