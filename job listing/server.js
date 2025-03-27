const express = require('express');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3000;

// Firebase initialization (using environment variables)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const databaseURL = process.env.FIREBASE_DATABASE_URL;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
});

const db = admin.firestore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'your_secret_key', // **CHANGE THIS!**
    resave: false,
    saveUninitialized: true
}));

const adminUsers = [
    { username: 'admin1', password: '$2b$10$YOUR_ENCRYPTED_PASSWORD_1' }, // Replace with actual hashed passwords
    // ... more users
];

// Routes
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = adminUsers.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.authenticated = true;
        req.session.username = username;
        res.redirect('/admin');
    } else {
        res.redirect('/login?error=Invalid credentials');
    }
});

app.get('/admin', (req, res) => {
    if (req.session.authenticated) {
        res.sendFile(__dirname + '/public/admin.html');
    } else {
        res.redirect('/login');
    }
});

app.post('/addJob', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).send("Unauthorized");
    }

    const { jobTitle, location, salaryRange, experience, link } = req.body;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    db.collection('Job detail').add({ // Use 'Job detail' collection
        jobTitle,
        location,
        salaryRange,
        experience,
        link,
        postedBy: req.session.username,
        timestamp
    })
        .then(() => {
            res.redirect('/admin');
        })
        .catch((error) => {
            console.error('Error adding job:', error);
            res.status(500).send('Error adding job');
        });
});

app.get('/jobs', (req, res) => {
    db.collection('Job detail').orderBy('timestamp', 'desc').get() // Use 'Job detail' collection
        .then((snapshot) => {
            const jobs = [];
            snapshot.forEach((doc) => {
                jobs.push({ id: doc.id, ...doc.data() });
            });
            res.json(jobs);
        })
        .catch((error) => {
            console.error('Error getting jobs:', error);
            res.status(500).send('Error getting jobs');
        });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
