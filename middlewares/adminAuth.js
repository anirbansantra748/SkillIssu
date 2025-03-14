const adminPassKey = "7980015159";
const User = require('../models/UserSchema'); // Import the User model

module.exports = async (req, res, next) => {
    if (req.session.isAdminAuthenticated) {
        return next();
    }

    if (req.body.passkey === adminPassKey) {
        req.session.isAdminAuthenticated = true;

        // Ensure the user is logged in before making changes
        if (req.user) {
            try {
                await User.findByIdAndUpdate(req.user._id, { isAdmin: true });
                req.user.isAdmin = true; // Update session user object
            } catch (error) {
                console.error("Error updating user:", error);
                return res.render('admin/passkey', { error: "Something went wrong!" });
            }
        }

        return res.redirect('/admin');
    }

    res.render('admin/passkey', { error: req.body.passkey ? "Incorrect Passkey!" : "" });
};
