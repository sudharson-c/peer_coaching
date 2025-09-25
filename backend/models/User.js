const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
    isPlaced: { type: Boolean, default: false },
    reputation: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", UserSchema);