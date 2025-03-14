const Problem = require('../models/QuestionSchema');
const Comment = require('../models/CommentSchema');

// GET Discussion Page
module.exports.getComments = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id)
            .populate({
                path: 'comments',
                populate: { path: 'userId', select: 'username' },
                match: {
                    ...(req.query.language && { language: req.query.language }),
                    ...(req.query.search && {
                        $or: [
                            { description: new RegExp(req.query.search, 'i') },
                            { code: new RegExp(req.query.search, 'i') }
                        ]
                    })
                }
            });

        res.render('problems/discussion', { problem, req, query: req.query });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// POST New Comment
module.exports.newComment = async (req, res) => {
    try {
        const comment = new Comment({
            ...req.body,
            userId: req.user._id,
            problemId: req.params.id
        });

        await comment.save();

        // Update Problem
        await Problem.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } });

        res.redirect(`/comments/${req.params.id}/discuss`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// GET Edit Comment Page
module.exports.getEditComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment || comment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).send('Unauthorized');
        }
        res.render('problems/editcomment', { comment });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// PUT Update Comment
module.exports.updateComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment || comment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).send('Unauthorized');
        }

        comment.description = req.body.description;
        comment.code = req.body.code;
        comment.language = req.body.language;
        await comment.save();

        res.redirect(`/comments/${comment.problemId}/discuss`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// DELETE Comment
module.exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment || comment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).send('Unauthorized');
        }

        await Problem.findByIdAndUpdate(comment.problemId, { $pull: { comments: comment._id } });
        await comment.deleteOne();

        res.redirect(`/comments/${comment.problemId}/discuss`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
