
const authMiddleware = require("../middleware/authMiddleware");
const checkAuth = require("../middleware/roleMiddleware");
const User = require("../models/User");
const router = require("express").Router();



router.get("/me", authMiddleware, async (req, res) => {
    const user = req.user;
    res.json({ success: true, data: { id: user._id, username: user.username, email: user.email, role: user.role, reputation: user.reputation } });
});

router.put("/add-mentor/:id", authMiddleware, checkAuth, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Missing user ID' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'No such user' });
    user.role = 'mentor';
    await user.save();
    res.json({ success: true, message: 'User promoted to mentor', data: { id: user._id, username: user.username, email: user.email, role: user.role } });
});


router.get("/all", authMiddleware, checkAuth, async (req, res) => {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
});

module.exports = router;