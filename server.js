require("dotenv").config();

const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { findUserById } = require("./utils/store");
const events = require("./utils/events");
const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");
const adminRoutes = require("./routes/admin");
const { notFound, errorHandler } = require("./middleware/errorHandler");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_this_with_a_long_random_secret") {
  console.error("Set a private JWT_SECRET in your .env file before starting the server.");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json({ limit: "20kb" }));
app.get("/", (req, res) => {
  res.json({ message: "Secure Connect API is running", endpoints: ["/api/auth", "/api/notes", "/api/admin"] });
});
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/profile", require("./middleware/auth").authenticateToken, (req, res) => {
  res.json({ message: "Protected profile", user: req.user });
});

app.use(notFound);
app.use(errorHandler);

// Authenticate Socket.IO connections with a JWT passed in socket.auth.token.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication token required"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = findUserById(payload.sub);
    if (!user) return next(new Error("User not found"));
    socket.user = { id: user.id, username: user.username };
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", socket => {
  console.log(`[socket] ${socket.user.username} connected (${socket.id})`);
  socket.join("general");

  socket.on("chat:message", payload => {
    const text = payload && typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text || text.length > 1000) {
      socket.emit("chat:error", { message: "Message must contain 1–1000 characters" });
      return;
    }

    const message = {
      username: socket.user.username,
      text,
      sentAt: new Date().toISOString()
    };
    events.emit("chat:message", message);
    io.to("general").emit("chat:message", message);
  });

  socket.on("disconnect", reason => {
    console.log(`[socket] ${socket.user.username} disconnected: ${reason}`);
  });
});

const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));

module.exports = { app, server, io };
