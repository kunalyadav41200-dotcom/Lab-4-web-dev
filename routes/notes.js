const express = require("express");
const { randomUUID } = require("crypto");
const { getNotes, saveNotes } = require("../utils/store");
const { authenticateToken } = require("../middleware/auth");
const events = require("../utils/events");

const router = express.Router();
router.use(authenticateToken);

// GET /api/notes - list only the signed-in user's notes
router.get("/", (req, res, next) => {
  try {
    const notes = getNotes().filter(note => note.owner === req.user.id);
    res.json(notes);
  } catch (error) { next(error); }
});

// POST /api/notes - create a note
router.post("/", (req, res, next) => {
  try {
    const { title, content } = req.body || {};
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }
    const now = new Date().toISOString();
    const note = {
      id: randomUUID(),
      title: String(title).trim(),
      content: String(content).trim(),
      owner: req.user.id,
      createdAt: now,
      updatedAt: now
    };
    const notes = getNotes();
    notes.push(note);
    saveNotes(notes);
    events.emit("note:created", note);
    res.status(201).json(note);
  } catch (error) { next(error); }
});

// PUT /api/notes/:id - update an owned note
router.put("/:id", (req, res, next) => {
  try {
    const notes = getNotes();
    const index = notes.findIndex(note => note.id === req.params.id && note.owner === req.user.id);
    if (index === -1) return res.status(404).json({ message: "Note not found" });

    const { title, content } = req.body || {};
    if (title !== undefined) notes[index].title = String(title).trim();
    if (content !== undefined) notes[index].content = String(content).trim();
    notes[index].updatedAt = new Date().toISOString();
    saveNotes(notes);
    res.json(notes[index]);
  } catch (error) { next(error); }
});

// DELETE /api/notes/:id - delete an owned note
router.delete("/:id", (req, res, next) => {
  try {
    const notes = getNotes();
    const filtered = notes.filter(note => !(note.id === req.params.id && note.owner === req.user.id));
    if (filtered.length === notes.length) {
      return res.status(404).json({ message: "Note not found" });
    }
    saveNotes(filtered);
    res.json({ message: "Note deleted successfully" });
  } catch (error) { next(error); }
});

module.exports = router;
