const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
require('dotenv').config();
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");




const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "main")));


app.use((req, res, next) => {
    console.log("Cookies: ", req.cookies); // Log received cookies
    next();
});

let verificationCode = null

const transporter = nodemailer.createTransport({
    service:'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.use(
    session({
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, 
    })
);


let users = [
    {
        username: "user1",
        password: "pwd1",
        email: "omar.khodjapro@gmail.com" 
    },
    {
        username: "user2",
        password: "password2",
        email: "example@gmail.com" 
    }
];

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 5,
    message: "Too many attempts, try again later."
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.cookie("verify", user.username, { httpOnly: false, secure: false }); // Insecure cookie!
        res.json({ success: true, message: "Logged in, cookie set!" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});


// Step 2: Verify 2FA code
app.post('/login2', (req, res) => {
    const { code } = req.body;
    const loggedInUser = req.cookies.verify;
    const user = users.find(u => u.username === loggedInUser);
  

    if (parseInt(code) === req.session.verificationCode || req.session.cookie.user == user ) {
        req.session.verified = true; // Mark user as fully authenticated
       
        res.json({ success: true, message: "2FA verification successful!", user: req.session.user });

    } else {
        res.status(401).json({ success: false, message: "Invalid 2FA code." });
    }
});


app.get('/myaccount', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "User not logged in." });
    }
    res.json({ success: true, user: req.session.user });
});


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main", "login.html"));
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: "Logged out successfully" });
});
app.post('/email', async (req, res) => {
    const loggedInUser = req.cookies.verify;
    const user = users.find(u => u.username === loggedInUser);
    
    if (!user) {
        return res.status(401).json({ success: false, message: "User not found." });
    }
    req.session.user = user

    const verificationCode = Math.floor(0 + Math.random() * 99);

    req.session.verificationCode = verificationCode;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Your Verification Code",
            text: `Your verification code is ${verificationCode}`,
            html: `<b>Your verification code is ${verificationCode}</b>`
        });

        res.json({ success: true, message: "2FA code sent to your email." });

    } catch (error) {
        console.error("Email sending failed:", error);
        res.status(500).json({ success: false, message: "Failed to send email." });
    }
});






const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});