const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, default: 0 }, // 0 means free course
    videoLinks: [{ type: String }], // YouTube or other platform links
    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }], // List of problem IDs
    categories: [String], // Topics like 'Graph', 'DP', 'Recursion'
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    progress: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        completedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
        percentageCompleted: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
