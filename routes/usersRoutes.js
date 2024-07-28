const express = require("express");
const userController = require("../controllers/usersController");
const authController = require("../controllers/authController");
const app = require("../app");

const router = express.Router();

router.post("/signUp", authController.signUp);
router.post("/login", authController.login);
router.use(authController.protect);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);

module.exports = router;
