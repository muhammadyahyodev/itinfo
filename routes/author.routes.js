const { Router } = require("express");
const {
  getAuthors,
  addAuthor,
  getAuthor,
  updateAuthor,
  deleteAuthor,
  loginAuthor,
  logout,
  refreshAuthorToken,
} = require("../controllers/author.controller");

const router = Router();
const authorPolice = require("../middleware/authorPolice");
// const authorRolePolice = require("../middleware/authorRolePolice");
const Validators = require("../middleware/validator");

router.get("/", authorPolice, getAuthors);
router.post("/", Validators("author"), addAuthor);
router.post("/login", loginAuthor);
router.post("/logout", logout);
router.get("/refresh", refreshAuthorToken);
router.get("/:id", getAuthor);
router.put("/:id", authorPolice, updateAuthor);
router.delete("/:id", authorPolice, deleteAuthor);

module.exports = router;
