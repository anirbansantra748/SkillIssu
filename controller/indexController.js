
module.exports.homePage = (req, res) => {
    res.render('listings/index.ejs',{ user: req.user })
};
