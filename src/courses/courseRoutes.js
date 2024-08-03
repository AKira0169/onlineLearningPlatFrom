const express = require('express');
const courseController = require('./courseController');
const authController = require('../../middleware/authController');
const authorization = require('../../middleware/authorization');
const upload = require('../../utils/multer-config');
const uploadVideo = upload('videos', 'video', 'mp4');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/getLesson/:courseId/:moduleId/:lessonId',

  courseController.getLesson,
);
router.get('/filter', courseController.getCoursesByCategoryOrTag);

router.use(authorization.restrictTo('admin', 'instructor'));

router.route('/').get(courseController.getAllCourses);
router.post('/initCourse', courseController.initCourse);
router.post('/createModuleForCourse/:courseId', courseController.createModuleForCourse);
router.post('/createLesson/:courseId/:moduleId', uploadVideo.single('video'), courseController.createLesson);
router.patch('/updateCourse/:courseId', courseController.updateCourse);

router.route('/upload').post(uploadVideo.single('video'), courseController.uploadVideo);

module.exports = router;
