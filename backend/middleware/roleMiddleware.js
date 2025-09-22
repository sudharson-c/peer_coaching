const checkAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    if (req.user && req.user.role != 'admin')
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    next();
};

module.exports = checkAuth;