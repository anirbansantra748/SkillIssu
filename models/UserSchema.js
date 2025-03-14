const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String,
    profileLinks: {
        github: String,
        linkedin: String,
    },
    Country: { type: String, required: true, default: 'india'},
    isAdmin: { type: Boolean, default: false },
    stats: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
    },
    points: { type: Number, default: 0 },
    problemsSolved: [
        {
            problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
            submissions: { type: Number, default: 0 },
            status: { type: String, enum: ['Success', 'Failure'], default: 'Failure' },
        },
    ],
    totalSubmissions: { type: Number, default: 0 },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        },
    ],
    createdAt: { type: Date, default: Date.now },
    //add a like the problem array if like add problem id in there
    likedProblems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
        },
    ],
});

// Passport-Local-Mongoose plugin for handling username and password
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
