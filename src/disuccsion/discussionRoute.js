const express = require('express');
const router = express.Router();
const discussionController = require('./discussionController');
const authController = require('../../middleware/authController');
const authorization=require('../../middleware/authorization')



router.use(authController.protect);
router.post('/createdisuccsion/:lessonId', discussionController.createDiscussion);
router.get('/discussions', discussionController.getAllDiscussions);

router.get('/getdiscussion/:lessonId', discussionController.getDiscussionsForLesson);
router.delete('/:discussionId',authorization.restrictTo('admin', 'instructor') ,discussionController.deleteDiscussion);

router.post('/replytodiscussion/:discussionId', discussionController.addReplyToDiscussion);


router.post('/like/:discussionId', discussionController.likeOrUnlikeDiscussion);

module.exports = router;
