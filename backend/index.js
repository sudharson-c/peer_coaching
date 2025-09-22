const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

require("dotenv").config();

const app = express();
app.use(express.json());

const connectDB = require('./config/db');
connectDB();

const authRoutes = require('./routes/authRoutes');
const doubtRoutes = require('./routes/doubtRoutes');
const responseRoutes = require('./routes/responseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require("./routes/adminRoutes")

app.get("/", (req, res) => {
    return res.json({ success: true, data: "server says hi" });
})
app.use('/api/auth', authRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/response', responseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running successfully on port ${process.env.PORT}`);
});