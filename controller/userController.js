const User = require('../models/UserSchema');
const Problem = require('../models/QuestionSchema');
const wrapAsync = require('../utils/wrapAsync')

// Load environment variables
require('dotenv').config();


// Login Page
module.exports.renderLogin = (req, res) => {
    res.render('users/login.ejs');
};

// Register user
module.exports.registerUser = wrapAsync(async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err); // Pass error to the error handler
            res.redirect('/home');
        });
    } catch (err) {
        next(err); // Pass error to the error handler
    }
})

// Register page
module.exports.renderRegister = (req, res) => {
    res.render('users/register.ejs');
};

// Logout
module.exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err); // Pass error to the error handler
        res.redirect('/home');
    });
}

module.exports.seeProfile = wrapAsync(async (req, res, next) => {
    try {
        let user = req.user;

        // Fetch problem details for each solved problem
        let problemsSolved = await Promise.all(user.problemsSolved.map(async (solved) => {
            let problem = await Problem.findById(solved.problemId);
            return {
                problemId: solved.problemId,
                title: problem ? problem.title : 'Unknown Title'
            };
        }));

        res.render('users/profile', {
            username: user.username,  // Pass username
            profileLinks: user.profileLinks,
            stats: user.stats,
            points: user.points,
            totalSubmissions: user.totalSubmissions,
            problemsSolved,
            likedProblems: user.likedProblems,
            Country: user.Country // Pass Country correctly
        });
    } catch (err) {
        next(err);
    }
});
