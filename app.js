require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')
const methodOverride = require('method-override');
const helmet = require('helmet');
const User = require('./models/UserSchema')

// Models
// const User = require('./models/User');

// Variables
const mongo_url = 'mongodb+srv://opvmro460:oQSi3PUnafrbOwQv@cluster0.57nzu.mongodb.net/SkillIssu?retryWrites=true&w=majority&appName=Cluster0';

const app = express();
const port = 3000;

// MongoDB Connection
mongoose.connect(mongo_url)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


// Set EJS as template engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.json());
app.use(helmet());

const store =  MongoStore.create({
    mongoUrl:mongo_url,
    crypto: {
      secret: "AnirbanOpi1234",
    },
    touchAfter: 24 * 3600,
  });

  store.on("error",()=>{
    console.log("error in moongoose session",err);
  });

// Session configuration
app.use(expressSession({
    store,
    secret: 'AnirbanOpi1234',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.user = req.user || null; // Make user available in all EJS views
    next();
});


// Routes
const userRoutes = require('./routes/user');
const indexRoutes = require('./routes/index');
const problemRoute = require('./routes/problems')
const contestRoute = require('./routes/contest')
const commentRoute = require('./routes/comment')
const courseRoutes = require('./routes/course');
const adminRoutes = require('./routes/adminRoutes')

app.use('/', indexRoutes);
app.use('/users', userRoutes);
app.use('/problems',problemRoute)
app.use('/contests',contestRoute)
app.use('/comments',commentRoute)
app.use('/courses', courseRoutes);
app.use('/admin',adminRoutes)


// 404 Not Found Handler
app.use((req, res, next) => {
    res.status(404).render('error', { error: { status: 404, message: "Page Not Found" } });
});

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com; " +
        "style-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "connect-src 'self';"
    );
    next();
});


// General Error Handler
app.use((err, req, res, next) => {
    const { status = 500, message = "Something went wrong" } = err;
    res.status(status).render('error', { error: { status, message } });
});


// Start server
app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});
