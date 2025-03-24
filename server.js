const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
require('dotenv').config();
const session = require("express-session");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "main")));


verificationCode = 0


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
        email: "user2@example.com" 
    }
];

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = user;
        res.json({ success: true, message: "2FA code sent to your email." });
        const code = Math.floor(0 + Math.random() * 99);
        verificationCode = code

        const mailOptions = await transporter.sendMail({
            from: {
                pass: process.env.EMAIL_USER

            }, // sender address
            to: user.email, // list of receivers
            subject: "verification code", // Subject line
            text:  `your verification code is ${code} `, // plain text body
            html: `<b>Your verification code is ${code}</b>`
        });
        const sendMail = async(transporter,mailOptions)=>
            {
            
            try {
                await transporter.sendMail(mailOptions)
                console.log("email has been sent")
                
             
            } catch (error) {
                console.error("❌ Email sending failed:", error);
                res.status(500).json({ success: false, message: "Failed to send email." });
            }
       }

   

    } else {
        res.status(401).json({ success: false, message: "Invalid username or password." });
    }
});

// Step 2: Verify 2FA code
app.post('/login2', (req, res) => {
    const { code } = req.body;
    
    if (verificationCode == code) {
        const user = users.find(u => u.username); 
        res.json({ success: true, message: "2FA verification successful!", user: req.session.user });
    } else {
        res.status(401).json({
            success: false, message: "Invalid 2FA code.", user: {
                username: user.username,
                email: user.email
            } });
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





const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});