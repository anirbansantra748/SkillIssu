const express = require('express');
const router = express.Router();
const courseController = require('../controller/courseController');
const { isLoggedIn } = require('../middlewares/isLoggedIn');
const { isAdmin } = require('../middlewares/isAdmin');

// Admin Routes
router.get('/new',isLoggedIn,isAdmin,courseController.renderNewCourseForm);
router.post('/new',isLoggedIn,isAdmin,courseController.createCourse);

router.get('/:id/edit',isLoggedIn,isAdmin,courseController.renderEditCourseForm);
router.put('/:id',isLoggedIn,isAdmin,courseController.updateCourse);
router.delete('/:id/delete',isLoggedIn,isAdmin,courseController.deleteCourse);

// User Routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

module.exports = router;
