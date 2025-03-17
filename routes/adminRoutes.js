const express = require('express');
const router = express.Router();
const problemController = require('../controller/problemController');
const contestController = require('../controller/contestController');
const courseController = require('../controller/courseController');
// const storeController = require('../controller/storeController');
const adminAuth = require('../middlewares/adminAuth'); // Middleware for passkey authentication
const { isAdmin } = require('../middlewares/isAdmin');
const { isLoggedIn } = require('../middlewares/isLoggedIn');


// Show passkey input form
router.get('/login',isLoggedIn, (req, res) => {
    res.render('passkey', { error: "" });
});

// Apply passkey authentication
router.post('/login', adminAuth);

// Admin Dashboard (Accessible only after correct passkey)
router.get('/', adminAuth, (req, res) => {
    res.render('admin/dashboard');
});

// Problem Management
router.get('/problems/new',  problemController.renderNewProblemForm);
router.post('/problems/new', problemController.createProblem);
router.get('/problems/:id/edit', problemController.renderEditProblemForm);
router.put('/problems/:id', problemController.updateProblem);
router.delete('/problems/:id', problemController.deleteProblem);

// Contest Management
router.get('/contests/new', contestController.renderNewContestForm);
router.post('/contests/new', contestController.createContest);
router.get('/contests/:id/edit', contestController.renderEditContestForm);
router.put('/contests/:id', contestController.updateContest);
router.delete('/contests/:id', contestController.deleteContest);

// Course Management
router.get('/courses/new', courseController.renderNewCourseForm);
router.post('/courses/new', courseController.createCourse);
router.get('/courses/:id/edit', courseController.renderEditCourseForm);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

// Store Management
// router.get('/store/new', isAdmin, storeController.renderNewItemForm);
// router.post('/store/new', isAdmin, storeController.createItem);
// router.get('/store/:id/edit', isAdmin, storeController.renderEditItemForm);
// router.put('/store/:id', isAdmin, storeController.updateItem);
// router.delete('/store/:id', isAdmin, storeController.deleteItem);

module.exports = router;
