const authMiddleware = require('../middleware/authMiddleware');
const Doubt = require('../models/Doubt');
const Notification = require('../models/Notification');
const Response = require('../models/Response');

const router = require('express').Router();

router.post('/:id', authMiddleware, async (req, res) => {
    const { content, attachments } = req.body;
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });
    const isByMentor = req.user.role === 'mentor' || req.user.isPlaced;
    const response = new Response({ doubt: doubt._id, author: req.user._id, content, attachments: attachments || [], isByMentor });
    await response.save();

    // create a notification for doubt owner
    const note = new Notification({ user: doubt.postedBy, type: 'new_response', message: `New response to your doubt: ${doubt.title}`, data: { doubtId: doubt._id, responseId: response._id } });
    await note.save();
    return res.json({ success: true, data: response });
});


router.get('/:id/responses', authMiddleware, async (req, res) => {
    const responses = await Response.find({ doubt: req.params.id }).populate('author', 'username role');
    return res.json({ success: true, data: responses || [] });
});


router.patch('/:id', authMiddleware, async (req, res) => {
    const response = await Response.findById(req.params.id);
    if (!response) return res.status(404).json({ success: false, message: 'Not found' });
    if (!response.author.equals(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not owner' });
    const { content, attachments } = req.body;
    if (content) response.content = content;
    if (attachments) response.attachments = attachments;
    response.updatedAt = new Date();
    await response.save();
    return res.json({ success: true, data: response });
});


router.delete('/:id', authMiddleware, async (req, res) => {
    const response = await Response.findById(req.params.id);
    if (!response) return res.status(404).json({ success: false, message: 'Not found' });
    if (!response.author.equals(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not owner' });
    await response.remove();
    return res.json({ success: true, message: 'Deleted' });
});


router.post('/:id/like', authMiddleware, async (req, res) => {
    const response = await Response.findById(req.params.id);
    if (!response) return res.status(404).json({ success: false, message: 'Not found' });
    response.likes = (response.likes || 0) + 1;
    await response.save();

    // increase author's reputation
    const author = await User.findById(response.author);
    if (author) {
        author.reputation = (author.reputation || 0) + 10; // arbitrary points
        await author.save();
    }
    return res.json({ success: true, data: response });
});

module.exports = router;