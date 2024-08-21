const noteController = require('./noteController');
const express = require('express');
const router = express.Router();

router.post('/', noteController.createNote);
router.get('/', noteController.getNotes);
router.get('/view', noteController.view);

module.exports = router;
