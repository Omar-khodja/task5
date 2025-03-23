const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "main")));

// Mock database
let users = [
    {
        username: "user1",
        password: "password1",
        email: "user1@example.com" 
    },
    {
        username: "user2",
        password: "password2",
        email: "user2@example.com" 
    }
];

// Store 2FA codes
let twoFaCodes = {};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your-email@gmail.com", // Replace with your Gmail address
        pass: "your-app-password"    // Replace with your Gmail app password
    }
});

// Step 1: Login and send 2FA code
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const code = Math.floor(1000 + Math.random() * 9000);
        twoFaCodes[username] = code; // Store the code for the user

        const mailOptions = {
            from: "your-email@gmail.com",
            to: user.email, // Use the email from the user object
            subject: "Your 2FA Verification Code",
            text: `Your 2FA code is: ${code}`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ 2FA code sent to ${user.email}: ${code}`);
            res.json({ success: true, message: "2FA code sent to your email." });
        } catch (error) {
            console.error("❌ Email sending failed:", error);
            res.status(500).json({ success: false, message: "Failed to send email." });
        }
    } else {
        res.status(401).json({ success: false, message: "Invalid username or password." });
    }
});

// Step 2: Verify 2FA code
app.post('/login2', (req, res) => {
    const { code } = req.body;

    // Broken Logic: The server does not check which user the code belongs to
    const validUser = Object.keys(twoFaCodes).find(user => twoFaCodes[user] == code);

    if (validUser) {
        res.json({ success: true, message: "2FA verification successful!" });
    } else {
        res.status(401).json({ success: false, message: "Invalid 2FA code." });
    }
});





const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});