const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { getUsers } = require("../utils/store");

const router = express.Router();
router.get("/users", authenticateToken, authorizeRoles("admin"), (req, res, next) => {
  try {
    const users = getUsers().map(({ id, username, email, role, createdAt }) =>
      ({ id, username, email, role, createdAt })
    );
    res.json(users);
  } catch (error) { next(error); }
});

module.exports = router;
