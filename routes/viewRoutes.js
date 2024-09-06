const express = require('express');
const viewController = require('../controllers/viewController');

const router = express.Router();

router.route('/').get(viewController.overview);
router.route('/newpost').get(viewController.composePost);
router.route('/:id').get(viewController.getPost);
router.route('/:id/editpost').get(viewController.editPost);

module.exports = router;
