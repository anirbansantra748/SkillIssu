const Course = require('../models/CourseSchema');
const Problem = require('../models/QuestionSchema');
const wrapAsync = require('../utils/wrapAsync');

// Render new course form
module.exports.renderNewCourseForm = (req, res) => {
    res.render('courses/new');
};

// Create a new course
module.exports.createCourse = wrapAsync(async (req, res,next) => {
    try {
        const { title, description, price, videoLinks, problems, categories, difficulty } = req.body;

        // Ensure problems is properly formatted
        const problemNumbers = problems.split(',').map(num => parseInt(num.trim(), 10));

        // Validate problems
        const foundProblems = await Problem.find({ number: { $in: problemNumbers } });
        if (foundProblems.length !== problemNumbers.length) {
            return res.status(400).send("One or more Problem numbers are invalid or not found.");
        }

        // Convert problem documents to their ObjectIds
        const problemIds = foundProblems.map(problem => problem._id);

        // Create new course
        const course = new Course({
            title,
            description,
            price,
            videoLinks,
            problems: problemIds,
            categories,
            difficulty
        });

        await course.save();
        res.redirect(`/courses/${course._id}`);
    } catch (error) {
        console.error("Error creating course:", error);
        return next({ status: 500, message: "Error creating course" });
    }
})

// Get all courses
module.exports.getAllCourses = async (req, res,next) => {
    try {
        const courses = await Course.find().populate('problems');
        res.render('courses/index', { courses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return next({ status: 500, message: "Error while fetching course" });
    }
};


module.exports.getCourseById = wrapAsync(async (req, res,next) => {
    try {
        const course = await Course.findById(req.params.id).populate('problems');
        if (!course) return next({ status: 500, message: "Error while fetching the course" });

        let videoLinks = [];

        if (Array.isArray(course.videoLinks)) {
            videoLinks = course.videoLinks.flatMap(link => link.split(",").map(v => v.trim()));
        } else if (typeof course.videoLinks === "string") {
            videoLinks = course.videoLinks.split(",").map(link => link.trim());
        }

        // Get the logged-in user's solved problems
        let solvedProblems = [];
        if (req.user) {
            solvedProblems = req.user.problemsSolved.map(p => p.problemId.toString());
        }
        const isadmin = req.user.isAdmin
        res.render('courses/show', { course, videoLinks, solvedProblems,isadmin });
    } catch (error) {
        console.error("Error fetching course:", error);
        return next({ status: 500, message: "Error while fetching course" });
    }
})


// Render edit course form
module.exports.renderEditCourseForm = async (req, res,next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).send("Course not found.");
        res.render('courses/edit', { course });
    } catch (error) {
        console.error("Error rendering edit form:", error);
        return next({ status: 500, message: "Error rendering edit form" });
    }
};

// Update a course
// module.exports.updateCourse = wrapAsync(async (req, res,next) => {
//     try {
//         const { title, description, price, videoLinks, problems, categories, difficulty } = req.body;

//         const problemNumbers = problems.split(',').map(num => parseInt(num.trim(), 10));
//         const foundProblems = await Problem.find({ number: { $in: problemNumbers } });

//         if (foundProblems.length !== problemNumbers.length) {
//             return res.status(400).send("One or more Problem numbers are invalid or not found.");
//         }

//         const problemIds = foundProblems.map(problem => problem._id);

//         const course = await Course.findByIdAndUpdate(req.params.id, {
//             title,
//             description,
//             price,
//             videoLinks,
//             problems: problemIds,
//             categories,
//             difficulty
//         }, { new: true });

//         if (!course) return res.status(404).send("Course not found.");

//         res.redirect(`/courses/${course._id}`);
//     } catch (error) {
//         console.error("Error updating course:", error);
//         return next({ status: 500, message: "Error updating the course" });
//     }
// })

module.exports.updateCourse = wrapAsync(async (req, res, next) => {
    try {
        const { title, description, price, videoLinks, problems, categories, difficulty } = req.body;

        // Ensure problems is a valid array of numbers
        const problemNumbers = problems
            .split(',')
            .map(num => num.trim())  // Trim spaces
            .filter(num => num !== "") // Remove empty values
            .map(num => parseInt(num, 10)) // Convert to integers
            .filter(num => !isNaN(num)); // Remove NaN values

        if (problemNumbers.length === 0) {
            return res.status(400).send("No valid problem numbers provided.");
        }

        const foundProblems = await Problem.find({ number: { $in: problemNumbers } });

        if (foundProblems.length !== problemNumbers.length) {
            return res.status(400).send("One or more Problem numbers are invalid or not found.");
        }

        const problemIds = foundProblems.map(problem => problem._id);

        const course = await Course.findByIdAndUpdate(req.params.id, {
            title,
            description,
            price: parseFloat(price) || 0, // Ensure price is a number
            videoLinks,
            problems: problemIds,
            categories,
            difficulty
        }, { new: true });

        if (!course) return res.status(404).send("Course not found.");

        res.redirect(`/courses/${course._id}`);
    } catch (error) {
        console.error("Error updating course:", error);
        return next({ status: 500, message: "Error updating the course" });
    }
});


// Delete a course
module.exports.deleteCourse = wrapAsync(async (req, res,next) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).send("Course not found.");
        res.redirect('/courses');
    } catch (error) {
        console.error("Error deleting course:", error);
        return next({ status: 500, message: "Error while deleting the course" });
    }
})
