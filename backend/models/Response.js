const mongoose = require('mongoose');

const ResponseSchema = mongoose.Schema({
    doubt: { type: mongoose.Schema.Types.ObjectId, ref: 'Doubt', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    attachments: [{ url: String, type: String }],
    isByMentor: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Response', ResponseSchema);