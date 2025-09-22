const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")


router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    const existing = await User.findOne({ username, email });
    if (existing) return res.status(400).json({ success: false, message: 'User already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });
    await user.save();
    const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
});


router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'No such user' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
});

module.exports = router;