const { Router } = require("express");
const {
  getUsers,
  addUser,
  loginUser,
  getUser,
  updateUser,
  deleteUser,
  logout,
  refreshUserToken,
  userActivate,
} = require("../controllers/user.controller");

const router = Router();
const userPolice = require("../middleware/userPolice");
const Validator = require("../middleware/validator");

router.get("/", getUsers);
router.get("/activate/:link", userActivate);

router.post("/", Validator("user"), addUser);
router.post("/login", Validator("email_pass"), loginUser);
router.post("/logout", logout);
router.get("/refresh", refreshUserToken);
router.get("/:id", getUser);
router.put("/:id", userPolice, Validator("user"), updateUser);
router.delete("/:id", userPolice, deleteUser);

module.exports = router;
