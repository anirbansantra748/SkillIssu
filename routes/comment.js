const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/isLoggedIn');
const commentController = require('../controller/commentController');
const { isAdmin } = require('../middlewares/isAdmin');

router.get('/:id/discuss', commentController.getComments);
router.post('/:id/comments',isLoggedIn, commentController.newComment);
router.get('/:commentId/edit', isLoggedIn, commentController.getEditComment);
router.put('/:commentId/edit', isLoggedIn, commentController.updateComment);
router.delete('/:commentId', isLoggedIn, commentController.deleteComment);

module.exports = router;
