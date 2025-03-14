const express = require('express');
const router = express.Router();
const problemController = require('../controller/problemController');
const { isLoggedIn } = require('../middlewares/isLoggedIn');
const { isAdmin } = require('../middlewares/isAdmin');

router.get('/new', problemController.renderNewProblemForm);
router.post('/new', problemController.createProblem);

router.get('/',isLoggedIn, problemController.getAllProblems);
router.get('/:id',isLoggedIn, problemController.getProblem);
router.get('/:id/edit',  problemController.renderEditProblemForm);
router.put('/:id/edit',problemController.updateProblem);
router.delete('/:id', isAdmin, problemController.deleteProblem);

// Submission & Filtering
router.post('/:id/submit', isLoggedIn, problemController.submitSolution);

// Like & Dislike
router.post('/:id/like', isLoggedIn, problemController.likeProblem);

module.exports = router;
