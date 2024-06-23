const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const path = require('path');
const flash = require('connect-flash');
const nodemailer = require('nodemailer'); // Add Nodemailer

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Mock user data
const users = [{ id: 1, email: "user@example.com", password: bcrypt.hashSync("password", 10) }];

passport.use(new LocalStrategy({ usernameField: 'email' },
    function(email, password, done) {
        const user = users.find(u => u.email === email);
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
    done(null, user);
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'views', 'signup.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/notification', (req, res) => res.sendFile(path.join(__dirname, 'views', 'notification.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));
app.get('/events', (req, res) => res.sendFile(path.join(__dirname, 'views', 'events.html')));
app.get('/post_event', (req, res) => res.sendFile(path.join(__dirname, 'views', 'post_event.html')));
app.get('/faqs', (req, res) => res.sendFile(path.join(__dirname, 'views', 'faqs.html')));

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        req.flash('error', 'Email is already registered');
        return res.redirect('/signup');
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    users.push({ id: users.length + 1, email, password: hashedPassword });
    req.flash('success', 'You are now registered and can log in');
    res.redirect('/login');
});

// Route to send notification
app.post('/notifications/send', (req, res) => {
    const { email, subject, message } = req.body;

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.redirect('/notification');
        }
        console.log('Email sent: ' + info.response);
        res.redirect('/notification');
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
