const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

const router = require("express").Router();

router.get('/', authMiddleware, async (req, res) => {
    const notes = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notes });
});


router.post('/:id/read', authMiddleware, async (req, res) => {
    const note = await Notification.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    if (!note.user.equals(req.user._id)) return res.status(403).json({ success: false, message: 'Not owner' });
    note.read = true;
    await note.save();
    res.json({ success: true, data: note });
});

router.delete('/:id', authMiddleware, async (req, res) => {
    const note = await Notification.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    if (!note.user.equals(req.user._id)) return res.status(403).json({ success: false, message: 'Not owner' });
    await Notification.deleteOne({ _id: note._id });
    res.json({ success: true, message: 'Deleted' });
});

module.exports = router