const authMiddleware = require('../middleware/authMiddleware');
const Doubt = require('../models/Doubt');
const Response = require('../models/Response');

const router = require('express').Router();


router.post('/', authMiddleware, async (req, res) => {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });
    const doubt = new Doubt({ title, description, postedBy: req.user._id });
    await doubt.save();
    return res.json({ success: true, data: doubt });
});


router.get('/', authMiddleware, async (req, res) => {
    const doubts = await Doubt.find().sort({ createdAt: -1 }).populate('postedBy', 'username');
    return res.json({ success: true, data: doubts });
});


router.get('/:id', authMiddleware, async (req, res) => {
    const doubt = await Doubt.findById(req.params.id).populate('postedBy', 'username');
    if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });
    const responses = await Response.find({ doubt: doubt._id }).populate('author', 'username role');
    return res.json({ success: true, data: { doubt, responses } });
});


router.patch('/:id', authMiddleware, async (req, res) => {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });
    if (!doubt.postedBy.equals(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not owner' });
    const { title, description, tags, status } = req.body;
    if (title) doubt.title = title;
    if (description) doubt.description = description;
    if (tags) doubt.tags = tags;
    if (status) doubt.status = status;
    await doubt.save();
    return res.json({ success: true, data: doubt });
});


router.delete('/:id', authMiddleware, async (req, res) => {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });
    if (!doubt.postedBy.equals(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not owner' });
    await Response.deleteMany({ doubt: doubt._id });
    await doubt.remove();
    return res.json({ success: true, message: 'Deleted' });
});

module.exports = router;