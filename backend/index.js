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

