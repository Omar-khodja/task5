const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
require('dotenv').config();

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

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const code = Math.floor(0 + Math.random() * 99);
        verificationCode = code

        const mailOptions = await transporter.sendMail({
            from: {
                name: "assingnment1",
                pass: process.env.USER

            }, // sender address
            to: user.email, // list of receivers
            subject: "verification code", // Subject line
            text:  `your verification code is ${code} `, // plain text body
            html: `<b>Your verification code is ${code}</b>`
        });
        const sendMail = async(transporter,mailOptions)=>{
            
            try {
                //await transporter.sendMail(mailOptions)
                res.json({ success: true, message: "2FA code sent to your email." });
             
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
        res.json({ success: true, message: "2FA verification successful!" });
    } else {
        res.status(401).json({ success: false, message: "Invalid 2FA code." });
    }
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main", "login.html"));
});





const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});