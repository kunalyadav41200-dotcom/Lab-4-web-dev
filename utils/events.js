const EventEmitter = require("events");

const appEvents = new EventEmitter();

appEvents.on("user:registered", user => {
  console.log(`[event] New user registered: ${user.username} (${user.email})`);
});

appEvents.on("note:created", note => {
  console.log(`[event] Note created: "${note.title}" by user ${note.owner}`);
});

appEvents.on("chat:message", message => {
  console.log(`[event] Chat message from ${message.username}: ${message.text}`);
});

module.exports = appEvents;
