const resend = require("../config/mail");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")



const EMAIL_SUBJECT = 'Verify your email';
const EMAIL_HTML_TEMPLATE = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome! Please verify your email address.</h2>
    <p>Click the button below to verify your email and complete your registration:</p>
    <a href="{verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
`;


router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    const existing = await User.findOne({ username, email });
    if (existing) return res.status(400).json({ success: false, message: 'User already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });
    await user.save();
    const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified }, token } });
});


router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'No such user' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified }, token } });
});

router.get("/me", authMiddleware, async (req, res) => {
    const user = req.user;
    res.json({ success: true, data: { id: user._id, username: user.username, email: user.email, role: user.role, reputation: user.reputation, isVerified: user.isVerified } });
});

router.post("/generate-token", (req, res) => {
    console.log("Generating token");
    const { email } = req.body;

    const token = jwt.sign({}, process.env.EMAIL_SECRET, { expiresIn: '1h' });


    const verificationUrl = `${process.env.SERVER_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    const htmlContent = EMAIL_HTML_TEMPLATE.replace(/{verificationUrl}/g, verificationUrl);
    const mailOptions = {
        from: process.env.EMAIL_HOST,
        to: email,
        subject: EMAIL_SUBJECT,
        html: htmlContent

    };
    resend.emails.send(mailOptions).then(() => {
        console.log('Email sent successfully');
        return res.json({ success: true, message: 'Verification email sent' });
    }).catch(error => {
        console.error('Error sending email:', error);
        return res.status(500).json({ success: false, message: 'Error sending email' });
    })
});
router.post("/verified", async (req, res) => {
    console.log("Checking verification status");
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Missing email' });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'No such user' });
        return res.json({ success: true, isVerified: user.isVerified });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get("/verify-email", async (req, res) => {
    console.log("Verifying email");
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Missing token' });
    try {
        const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
        const email = decoded.email;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'No such user' });
        if (user.isVerified) return res.json({ success: true, message: 'Email already verified' });
        user.isVerified = true;
        await user.save();
        return res.json({ success: true, message: 'Email verified successfully' });

    } catch (e) {
        console.log(e);
        return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
})

module.exports = router;