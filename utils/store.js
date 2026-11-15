const fs = require("fs");
const path = require("path");
const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const NOTES_FILE = path.join(DATA_DIR, "notes.json");

function ensureFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const file of [USERS_FILE, NOTES_FILE]) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
  }
}

function read(file) {
  ensureFiles();
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new Error(`Could not read data file: ${path.basename(file)}`);
  }
}

function write(file, records) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(records, null, 2), "utf8");
}

const getUsers = () => read(USERS_FILE);
const saveUsers = (users) => write(USERS_FILE, users);
const getNotes = () => read(NOTES_FILE);
const saveNotes = (notes) => write(NOTES_FILE, notes);

function findUserByEmail(email) {
  return getUsers().find(user => user.email.toLowerCase() === email.toLowerCase());
}
function findUserById(id) {
  return getUsers().find(user => user.id === id);
}

module.exports = {
  getUsers, saveUsers, getNotes, saveNotes,
  findUserByEmail, findUserById
};
