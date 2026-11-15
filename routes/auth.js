const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { getUsers, saveUsers, findUserByEmail } = require("../utils/store");
const events = require("../utils/events");

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (findUserByEmail(email)) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, rounds);
    const user = {
      id: randomUUID(),
      username: String(username).trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "user",
      createdAt: new Date().toISOString()
    };

    const users = getUsers();
    users.push(user);
    saveUsers(users);
    events.emit("user:registered", user);

    return res.status(201).json({
      message: "User registered",
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
