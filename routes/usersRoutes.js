const express = require("express");
const userController = require("../controllers/usersController");
const authController = require("../middleware/authController");
const authorization = require("../middleware/authorization");

const router = express.Router();
router.get("/:id", userController.getUser);

router.post("/signUp", authController.signUp);
router.post("/logIn", authController.logIn);
router.use(
  authController.protect,
  authorization.restrictTo("admin", "student")
);
router.get("/", userController.getAllUsers);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);


module.exports = router;
