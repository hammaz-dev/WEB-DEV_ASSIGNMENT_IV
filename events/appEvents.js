// Event-driven features using Node.js EventEmitter.
// Routes/sockets emit events; listeners here react independently (loose coupling).
const EventEmitter = require('events');

class AppEmitter extends EventEmitter {}
const appEvents = new AppEmitter();

const stamp = () => new Date().toISOString();

appEvents.on('user:registered', (user) => {
  console.log(`[event ${stamp()}] user:registered -> ${user.username} (${user.email})`);
});

appEvents.on('user:login', (user) => {
  console.log(`[event ${stamp()}] user:login -> ${user.username}`);
});

appEvents.on('user:loginFailed', (email) => {
  console.warn(`[event ${stamp()}] user:loginFailed -> ${email}`);
});

appEvents.on('note:created', (note) => {
  console.log(`[event ${stamp()}] note:created -> "${note.title}" by ${note.owner}`);
});

appEvents.on('note:updated', (note) => {
  console.log(`[event ${stamp()}] note:updated -> ${note._id}`);
});

appEvents.on('note:deleted', (id) => {
  console.log(`[event ${stamp()}] note:deleted -> ${id}`);
});

appEvents.on('chat:message', ({ room, username, text }) => {
  console.log(`[${room}] ${username}: ${text}`);
});

module.exports = appEvents;
