const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
require('dotenv').config();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const rateLimit = require("express-rate-limit");




const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "main")));
const verificationCodes = {};
const usersFile = path.join(__dirname, "data.json");



const transporter = nodemailer.createTransport({
    service:'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly:true,
            sameSite: 'lax',
            name: 'myapp_session', 
        },
        
    })
);
app.use((req, res, next) => {
    console.log("Cookies: ", req.cookies);
    console.log("Session: ", req.session);
    next();
});

function loadUsers() {
    if (fs.existsSync(usersFile)) {
        const data = fs.readFileSync(usersFile);
        return JSON.parse(data);
    }
    return [];
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

const verfylimit = rateLimit({
    windowMs:1*60*1000,
    max:3,
    msg: "Too many attempts, try again later"
})

let users = loadUsers();


app.post("/register",(req,res)=>{
    const { username, email, password } = req.body;
    const user = users.find(u => u.username === username  )
    if(user){
      return  res.json({success:false , message:"user is already exists"});
    }
    const newUser = { username, password, email };
    users.push(newUser);
    saveUsers(users);
    res.json({ success: true, message: "Registrasion successful" });

})

app.post("/1_ver", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = username
        res.cookie("verify", user.username, ); 
        res.json({ success: true, message: "Logged in, cookie set!" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});



app.post('/2_ver', (req, res) => {
    const { code } = req.body;
    const loggedInUser = req.cookies.verify;
    const user = users.find(u => u.username === loggedInUser);


    if (!user) {
        return res.status(401).json({ success: false, message: "User not authenticated." });
    }


    if (parseInt(code) === verificationCodes[user.username]) {
        req.session.verified = true;
        return res.json({ success: true, message: "2FA verification successful!", user: user });
    }

    res.status(401).json({ success: false, message: "Invalid 2FA code." });
});


app.post('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie("myapp_session");
    res.json({ success: true, message: "Logged out successfully" });
});
app.post('/email', async (req, res) => {
    const loggedInUser = req.cookies.verify;
    const user = users.find(u => u.username === loggedInUser);

    if (!user) {
        return res.status(401).json({ success: false, message: "User not found." });
    }
    
    const verificationCode = Math.floor(0 + Math.random() * 99);

    verificationCodes[user.username] = verificationCode;
    console.log(verificationCode)

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Your Verification Code",
            text: `Your verification code is ${verificationCodes[user.username]}`,
            html: `<b>Your verification code is ${verificationCodes[user.username]}</b>`
        });

        res.json({ success: true, message: "2FA code sent to your email." });

    } catch (error) {
        console.error("Email sending failed:", error);
        res.status(500).json({ success: false, message: "Failed to send email." });
    }
});




app.get("/login2", (req, res) => {
    res.sendFile(path.join(__dirname, "main", "login2.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "main", "login.html"));
});

app.get("/myaccount", (req, res) => {
    res.sendFile(path.join(__dirname, "main", "myaccount.html"));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main", "registration.html"));
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});