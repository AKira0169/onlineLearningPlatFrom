const express = require("express");
const userController = require("../controllers/usersController");
const authController = require("../middleware/authController");
const authorization = require("../middleware/authorization");

const router = express.Router();

router.post("/signUp", authController.signUp);
router.post("/logIn", authController.logIn);
router.use(
  authController.protect,
  authorization.restrictTo("admin", "student")
);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);

module.exports = router;
