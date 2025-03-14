const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    number: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    examples: [{ input: String, output: String, explanation: String }],
    constraints: [String],
    testCases: [{ input: String, expectedOutput: String }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    categories: [String], // DSA topics like 'Array', 'Graph', 'Dynamic Programming'
    tags: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    templates: {
        python3: { type: String, required: true },
        javascript: { type: String, required: true },
        java: { type: String, required: true },
        cpp: { type: String, required: true },
        c: { type: String, required: true }
    },
    submissions: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Problem', problemSchema);
