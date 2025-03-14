const Contest = require('../models/ContestSchema');
const Problem = require('../models/QuestionSchema');
const User = require('../models/UserSchema');
const wrapAsync = require('../utils/wrapAsync');


// Utility to get next Sunday
function getNextSunday() {
    const now = new Date();
    now.setDate(now.getDate() + ((7 - now.getDay()) % 7)); // Next Sunday
    now.setHours(19, 0, 0, 0); // Fix time to 7 PM
    return now;
}

//NOTE: admin routes
//TODO: CURD API
// Render New Contest Form
module.exports.renderNewContestForm = (req, res) => {
    res.render('contests/new');
};

module.exports.createContest = wrapAsync(async (req, res,next) => {
    try {
        const { title, number, description, problems } = req.body;

        // Ensure problems is properly formatted
        const problemNumbers = problems.split(',').map(num => parseInt(num.trim(), 10));

        // Validate problems
        const foundProblems = await Problem.find({ number: { $in: problemNumbers } });
        if (foundProblems.length !== problemNumbers.length) {
            return res.status(400).send("One or more Problem numbers are invalid or not found.");
        }

        // Convert problem documents to their ObjectIds
        const problemIds = foundProblems.map(problem => problem._id);

        // Create new contest
        const contest = new Contest({
            title,
            number,
            description,
            date: getNextSunday(),
            problems: problemIds
        });

        await contest.save();
        res.redirect(`/contests/current/`);
    } catch (error) {
        console.error("Error creating contest:", error);
        return next({ status: 500, message: "Error catching the contest" });
    }
})

module.exports.renderEditContestForm = async (req, res,next) => {
    try {
        // Step 1: Find the contest and populate the problems array
        const contest = await Contest.findById(req.params.id).populate('problems');

        if (!contest) {
            return res.status(404).send("Contest not found");
        }

        // Step 2: Extract problem numbers
        const problemNumbers = contest.problems.map(problem => problem.number).join(', ');

        res.render('contests/edit', { contest, problemNumbers });
    } catch (error) {
        console.error("Error rendering edit form:", error);
        return next({ status: 500, message: "Error rendering edit form" });
    }
};

// Update Contest
module.exports.updateContest = wrapAsync(async (req, res,next) => {
    try {
        const { title, description, problems } = req.body;

        // Step 1: Parse problem numbers
        const problemNumbers = problems.split(',').map(num => parseInt(num.trim(), 10));

        // Step 2: Find problems in the database by their number
        const foundProblems = await Problem.find({ number: { $in: problemNumbers } });

        if (foundProblems.length !== problemNumbers.length) {
            return res.status(400).send("One or more Problem numbers are invalid or not found.");
        }

        // Step 3: Extract ObjectId values of the found problems
        const problemIds = foundProblems.map(problem => problem._id);

        // Step 4: Update the contest
        await Contest.findByIdAndUpdate(req.params.id, {
            title,
            description,
            problems: problemIds
        });

        res.redirect(`/contests/current/`);
    } catch (error) {
        console.error("Error updating contest:", error);
        return next({ status: 500, message: "Error updating contest try again leter" });
    }
})

// Delete Contest
module.exports.deleteContest = wrapAsync(async (req, res,next) => {
    await Contest.findByIdAndDelete(req.params.id);
    res.redirect('/contests/current');
})

//TODO: contest apis
// Find Current Contest
module.exports.getCurrentContest = wrapAsync(async (req, res,next) => {
    const contests = await Contest.find().sort({ number: -1 }).populate('problems');
    const currentContest = contests[0];
    const pastContests = contests.slice(1);
    // const user = req.user

    const now = new Date();
    const a = (now == currentContest.date);
    const b = (now.getHours() >= currentContest.timeWindow.startHour);
    const canStart = a & b;

    res.render('contests/show', {
      contest: currentContest,
      pastContests,
      canStart,
    });
})

module.exports.renderContestPage = wrapAsync(async (req, res,next) => {
    try {
        const contest = await Contest.findById(req.params.id).populate('problems');
        const user = req.user;

        if (!contest) {
            return res.status(404).send("Contest not found");
        }

        // Check if user has already submitted the contest
        const hasSubmitted = contest.submissions.some(sub =>
            sub.userId.equals(user._id) && sub.status === "Completed"
        );

        const now = new Date();
        const canStart = now >= contest.date && now.getHours() >= contest.timeWindow.startHour;
        const canSubmit = canStart && now.getHours() <= contest.timeWindow.endHour;
        const questionCount = contest.problems.length;

        let alreadyParticipated = contest.submissions.some(sub => sub.userId.equals(user._id));

        // If user hasn't participated before, store a new submission
        if (!alreadyParticipated) {
            contest.submissions.push({ userId: user._id, startedAt: now });
            await contest.save();
        }
        const isadmin = user.isAdmin;
        res.render('contests/participate', {
            contest,
            canStart,
            canSubmit,
            questionCount,
            user,
            hasSubmitted,
            isadmin,
            alreadyParticipated
        });
    } catch (error) {
        console.error("Error rendering contest page:", error);
        return next({ status: 500, message: "Error rendering contest page" });
    }
})


// module.exports.submitContest = wrapAsync(async (req, res,next) => {
//     const { id } = req.params; // Contest ID
//     const user = req.user; // Logged-in user
//     const now = new Date();

//     try {
//         const contest = await Contest.findById(id).populate('problems');

//         if (!contest) {
//             // req.flash('error', 'Contest not found.');
//             return res.redirect('/contests/current');
//         }

//         // Check if user already submitted
//         const existingSubmission = contest.submissions.find(sub => sub.userId.equals(user._id));

//         if (existingSubmission) {
//             // req.flash('error', 'You have already submitted the contest.');
//             console.log("already submit lodu");
//             return res.redirect(`/contests/current/`);
//         }

//         // Check if all problems are solved by the user
//         const allSolved = contest.problems.every(problem =>
//             user.problemsSolved.some(p => p.problemId.equals(problem._id))
//         );

//         if (!allSolved) {
//             // req.flash('error', 'You must solve all problems before submitting.');
//             console.log("all problem solve koro");
//             return res.redirect(`/contests/current/`);
//         }

//         // Add new submission for the user
//         contest.submissions.push({
//             userId: user._id,
//             submissionTime: now,
//             status: 'Completed',
//             solvedCount: contest.problems.length
//         });

//         // Update user points
//         user.points += 1; // Increment participation points
//         await user.save();

//         // Save the updated contest
//         await contest.save();

//         // req.flash('success', 'Contest submitted successfully!');
//         res.redirect(`/contests/current/leaderboard/${id}`);
//     } catch (error) {
//         console.error('Error submitting contest:', error);
//         req.flash('error', 'Something went wrong. Please try again.');
//         res.redirect(`/contests/current/`);
//     }
// })

module.exports.submitContest = wrapAsync(async (req, res, next) => {
    const { id } = req.params; // Contest ID
    const user = req.user; // Logged-in user
    const now = new Date();

    try {
        const contest = await Contest.findById(id)
            .populate('problems')  // Load problems
            .populate('submissions.userId');  // Load submitted users

        if (!contest) {
            console.log("Contest not found.");
            return res.redirect('/contests/current');
        }

        // Ensure submissions array exists
        if (!Array.isArray(contest.submissions)) {
            contest.submissions = [];
        }

        // **Fix: Check properly if the user has already submitted**
        const existingSubmission = contest.submissions.some(sub =>
            sub.userId && sub.userId.toString() === user._id.toString()
        );

        if (existingSubmission) {
            console.log("User already submitted.");
            return res.redirect(`/contests/current/`);
        }

        // Check if all problems are solved by the user
        const allSolved = contest.problems.every(problem =>
            user.problemsSolved.some(p => p.problemId.toString() === problem._id.toString())
        );

        if (!allSolved) {
            console.log("Solve all problems before submitting.");
            return res.redirect(`/contests/current/`);
        }

        // Add new submission for the user
        contest.submissions.push({
            userId: user._id,
            submissionTime: now,
            status: 'Completed',
            solvedCount: contest.problems.length
        });

        // Update user points
        user.points += 1; // Increment participation points
        await user.save();

        // Save the updated contest
        await contest.save();

        console.log("Contest submitted successfully!");
        res.redirect(`/contests/current/leaderboard/${id}`);
    } catch (error) {
        console.error('Error submitting contest:', error);
        // req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(`/contests/current/`);
    }
});


// Show Leaderboard
module.exports.showLeaderboard = wrapAsync(async (req, res,next) => {
    const { id } = req.params;

    try {
        const contest = await Contest.findById(id).populate('submissions.userId', 'username'); // Populate username for each submission

        if (!contest) {
            req.flash('error', 'Contest not found.');
            return res.redirect('/contests/current');
        }

        // Sort submissions by submissionTime and take top 10
        const winners = contest.submissions
            .filter(sub => sub.status === 'Completed')
            .sort((a, b) => a.submissionTime - b.submissionTime)
            .slice(0, 10);

        // Update winners array with ranks and user details
        const winnersWithRanks = winners.map((winner, index) => ({
            username: winner.userId.username, // Access the username from populated data
            rank: index + 1,
            submissionTime: winner.submissionTime,
        }));

        // Update user points based on rank
        for (let i = 0; i < winners.length; i++) {
            const user = await User.findById(winners[i].userId);
            if (i === 0) user.points += 5; // 1st place
            else user.points += 3; // 2nd-10th place
            await user.save();
        }

        // Save the contest updates
        contest.winners = winnersWithRanks;
        await contest.save();

        // Render leaderboard with contest and winners
        res.render('contests/leaderboard', { contest, winners: winnersWithRanks });
    } catch (error) {
        console.error('Error showing leaderboard:', error);
        return next({ status: 500, message: "something went wrong with leaderboard try again later" });
    }
})

module.exports.getContestProblems = async (req, res,next) => {
    try {
        const contest = await Contest.findById(req.params.id).populate('problems');
        if (!contest) {
            return res.status(404).send("Contest not found");
        }
        res.render('contests/pastContest', { contest });
    } catch (error) {
        console.error("Error fetching contest problems:", error);
        return next({ status: 500, message: "error fetching the contest problems" });
    }
};
