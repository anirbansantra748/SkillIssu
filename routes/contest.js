const express = require('express');
const router = express.Router();
const contestController = require('../controller/contestController');
const { isLoggedIn } = require('../middlewares/isLoggedIn');
const { isAdmin } = require('../middlewares/isAdmin');

// Admin Routes
router.get('/new',isLoggedIn,isAdmin, contestController.renderNewContestForm);
router.post('/new',isLoggedIn,isAdmin,contestController.createContest);

router.get('/:id/edit',isAdmin,isLoggedIn,contestController.renderEditContestForm);
router.put('/:id',isLoggedIn,isAdmin, contestController.updateContest);
router.delete('/:id/delete',isLoggedIn,isAdmin,  contestController.deleteContest);

// Participant Routes
router.get('/current',isLoggedIn, contestController.getCurrentContest);
router.post('/current/start/:id',isLoggedIn, contestController.renderContestPage);
router.post('/current/submit/:id',isLoggedIn, contestController.submitContest);

// Leaderboard
router.get('/current/leaderboard/:id',isLoggedIn, isLoggedIn, contestController.showLeaderboard);

// Route to show all problems of a specific contest
router.get('/:id/pastContest',isLoggedIn, contestController.getContestProblems);


module.exports = router;
