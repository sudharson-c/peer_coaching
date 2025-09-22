
const authMiddleware = require("../middleware/authMiddleware");
const checkAuth = require("../middleware/roleMiddleware");
const Doubt = require("../models/Doubt");
const Response = require("../models/Response");
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


router.get("/all-users", authMiddleware, checkAuth, async (req, res) => {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
});

router.get('/doubts', authMiddleware, checkAuth, async (req, res) => {
    const doubts = await Doubt.find().sort({ createdAt: -1 }).populate('postedBy', 'name');
    res.json({ success: true, data: doubts });
});

router.post('/responses/:id/flag', authMiddleware, checkAuth, async (req, res) => {
    const response = await Response.findById(req.params.id);
    if (!response) return res.status(404).json({ success: false, message: 'Not found' });
    // For now we just delete — in a real app you'd mark flagged and review
    await response.remove();
    res.json({ success: true, message: 'Response removed' });
});

router.delete('/users/:id', authMiddleware, checkAuth, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Missing user ID' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({
        success: false, message: 'No such user'
    });
    await user.remove();
    res.json({ success: true, message: 'User deleted' });
}
);


module.exports = router;