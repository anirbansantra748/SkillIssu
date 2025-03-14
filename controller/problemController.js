const Problem = require('../models/QuestionSchema');
const axios = require('axios');
const User = require('../models/UserSchema');
const mongoose = require('mongoose');
const wrapAsync = require('../utils/wrapAsync')
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;


module.exports.submitSolution = wrapAsync(async (req,res,next) => {
    try {
        const { id } = req.params;
        const { code, language } = req.body;

        // Fetch problem details
        const problem = await Problem.findById(id);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found." });
        }

        // Generate structured AI prompt
        const prompt = `
### Problem Description:
${problem.description}

### Requirement:
Does the provided code correctly solve the problem as described above?

### Test Cases:
${problem.testCases.map((tc, i) => `
Test Case ${i + 1}:
- **Input:** "${tc.input}"
- **Expected Output:** "${tc.expectedOutput}"
`).join("\n")}

### User's Code:
Language: ${language}
\`\`\`${language}
${code}
\`\`\`

### Evaluation Criteria:
1. **Check if the problem statement is correctly implemented.**
2. **Run the code against the test cases.**
3. **If all test cases pass, mark correctness as "Yes".**
4. **If any test case fails, provide a detailed breakdown of what went wrong.**
5. **Ensure that false negatives (correct answers marked wrong) do not occur.**

### Response Format:
\`\`\`json
{
  "correctness": "Yes" or "No",
  "failed_cases": [
    {
      "input": "Test input",
      "expected_output": "Expected result",
      "actual_output": "Actual result"
    }
  ],
  "error_details": "If applicable, describe the issue",
  "improvements": "Suggested improvements to fix the problem"
}
\`\`\`
`;

        // Send request to AI API
        const response = await axios.post(GEMINI_API_URL, {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        }, { headers: { "Content-Type": "application/json" } });

        // Extract response text
        const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) {
            throw new Error("Invalid AI response format.");
        }

        console.log("AI Response:", resultText); // Debugging: Check AI response

        // Extract JSON safely
        const jsonMatch = resultText.match(/({[\s\S]*})/);
        if (!jsonMatch) {
            throw new Error("AI response does not contain valid JSON.");
        }

        let output;
        try {
            output = JSON.parse(jsonMatch[1].trim());
        } catch (error) {
            console.error("Error parsing AI response:", error);
            throw new Error("AI response is not valid JSON.");
        }

        // Ensure valid response structure
        if (!output || typeof output !== "object" || !output.hasOwnProperty("correctness")) {
            throw new Error("AI response missing required fields.");
        }
        const user = req.user;
        // If all test cases pass, ensure correctness is "Yes"
        const isPassed = output.correctness === "Yes" || (output.failed_cases.length === 0 && !output.error_details);
        if (isPassed) {
            // Increase user's points
            user.points += 1;

            // Find if user has solved this problem before
            let solvedBefore = user.problemsSolved.find(p => p.problemId.equals(problem._id));

            if (!solvedBefore) {
                // First time solving, add to problemsSolved
                user.problemsSolved.push({ problemId: problem._id, submissions: 1, status: "Success" });

                // Update stats based on problem difficulty
                if (problem.difficulty === "Easy") user.stats.easy += 1;
                if (problem.difficulty === "Medium") user.stats.medium += 1;
                if (problem.difficulty === "Hard") user.stats.hard += 1;
            } else {
                // Increment submission count and update status
                solvedBefore.submissions += 1;
                solvedBefore.status = "Success";
            }
        }

        // Increment total submissions count
        user.totalSubmissions += 1;
        await user.save();

        if (output.failed_cases.length === 0 && output.correctness === "No") {
            output.error_details = "All outputs match expected values. AI might have misinterpreted the result.";
        }

        return res.render("problems/result", {
            isPassed,
            result: output,
            problem,
            errorMessage: null
        });

    } catch (error) {
        console.error("Error evaluating solution:", error.message);
        return res.status(500).render("problems/result", {
            isPassed: false,
            result: null,
            problem: null,
            errorMessage: error.message || "Internal Server Error."
        });
    }
})

// Show All Problems
module.exports.getAllProblems = wrapAsync(async (req,res,next) => {
    const { difficulty, search } = req.query;

    let filter = {};

    // Filter by difficulty (Easy, Medium, Hard)
    if (difficulty) {
        filter.tags = difficulty;
    }

    // Search by title or number
    if (search) {
        const searchNumber = parseInt(search); // Convert to number if possible
        filter.$or = [
            { title: { $regex: search, $options: 'i' } } // Case-insensitive search for title
        ];
        if (!isNaN(searchNumber)) {
            filter.$or.push({ number: searchNumber }); // Add number filter if search is a valid number
        }
    }

    const problems = await Problem.find(filter).sort({ number: 1 });
    const user = req.user || null; // Get logged-in user
    const solvedProblems = user.problemsSolved.problemId;

    res.render('problems/index', { problems, difficulty, search, user ,solvedProblems });
})

module.exports.renderEditProblemForm = wrapAsync(async (req,res,next) => {
    const { id } = req.params;
    const problem = await Problem.findById(id);
    res.render('admin/editProblem', { problem });
})

module.exports.updateProblem = wrapAsync(async (req,res,next) => {
    const { id } = req.params;
    const updatedData = req.body.problem;

    // Ensure examples and testCases are parsed correctly
    if (typeof updatedData.examples === 'string') {
        updatedData.examples = JSON.parse(updatedData.examples);
    }
    if (typeof updatedData.testCases === 'string') {
        updatedData.testCases = JSON.parse(updatedData.testCases);
    }

    // Update the problem
    try {
        const updatedProblem = await Problem.findByIdAndUpdate(id, updatedData, { new: true });
        res.redirect('/problems');
    } catch (err) {
        console.error(err);
        return next({ status: 404, message: "Error while updating the problem" });
    }
})

// Show a specific problem with editor
module.exports.getProblem = wrapAsync(async (req,res, next) => {
    const { id } = req.params;

    // Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next({ status: 400, message: "Invalid Problem ID" });
    }

    const problem = await Problem.findById(id);
    if (!problem) {
        return next({ status: 404, message: "Problem Not Found" });
    }

    res.render('problems/show', {
        problem,
        templates: problem.templates,
        user: req.user
    });
});

module.exports.renderNewProblemForm = (req,res,next) => {
    res.render('admin/newProblem.ejs');
};

module.exports.createProblem = wrapAsync(async (req,res,next) => {
    try {
        const problemData = req.body.problem;

        // Parse examples and testCases if they are in string format
        if (typeof problemData.examples === 'string') {
            problemData.examples = JSON.parse(problemData.examples);
        }

        if (typeof problemData.testCases === 'string') {
            problemData.testCases = JSON.parse(problemData.testCases);
        }

        const newProblem = new Problem(problemData);
        await newProblem.save();
        res.redirect('/problems');
    } catch (err) {
        console.error(err);
        return next({ status: 404, message: "Error while creating the problem !" });
    }
})

// Delete Problem
module.exports.deleteProblem = wrapAsync(async (req,res,next) => {
    const { id } = req.params;
    await Problem.findByIdAndDelete(id);
    res.redirect('/problems');
})

// Like or Unlike a Problem
module.exports.likeProblem = wrapAsync(async (req,res,next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user._id);
        const problem = await Problem.findById(id);

        if (!problem) return res.status(404).send('Problem not found');

        const index = user.likedProblems.indexOf(problem._id);

        if (index !== -1) {
            // Problem already liked -> Unlike it
            console.log("already liked");
            user.likedProblems.splice(index, 1);
            problem.likes -= 1;
        } else {
            // Problem not liked -> Like it
            user.likedProblems.push(problem._id);
            problem.likes += 1;
            console.log("liked");
        }

        await user.save();
        await problem.save();

        // res.json({ liked: index === -1 }); // true if liked, false if unliked
        res.redirect(`/problems/${id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
