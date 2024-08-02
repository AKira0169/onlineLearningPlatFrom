const express = require("express");
const courseController = require("./courseController");
const upload = require("../../utils/multer-config");

const router = express.Router();

router.route("/").get(courseController.getAllCourses);
router.post("/initCourse", courseController.initCourse);
router.post(
  "/createModuleForCourse/:courseId",
  courseController.createModuleForCourse
);
router.post(
  "/createLesson/:courseId/:moduleId",
  upload.single("video"),
  courseController.createLesson
);
router.get(
  "/getLesson/:courseId/:moduleId/:lessonId",
  courseController.getLesson
);

router
  .route("/upload")
  .post(upload.single("video"), courseController.uploadVideo);

module.exports = router;
