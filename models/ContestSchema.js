const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    number: {type:Number, required: true},
    description: { type: String, required: true },
    date: { type: Date, required: true, default: () => getNextSunday() }, // Next Sunday
    timeWindow: {
        startHour: { type: Number, default: 19 },
        endHour: { type: Number, default: 21 }
    },
    problems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem',
        },
    ],
    submissions: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            startedAt: { type: Date },
            submissionTime: { type: Date },
            solvedCount: { type: Number, default: 0 },
            status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
        },
    ],
    winners: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank: { type: Number, required: true }, // Position (1-10)
            submissionTime: { type: Date, required: true },
        },
    ],
    createdAt: { type: Date, default: Date.now },
});

// Utility function to get the next Sunday's date
function getNextSunday() {
    const now = new Date();
    now.setDate(now.getDate() + ((7 - now.getDay()) % 7)); // Next Sunday
    now.setHours(19, 0, 0, 0); // Fix time to 7 PM
    return now;
}

module.exports = mongoose.model('Contest', contestSchema);
