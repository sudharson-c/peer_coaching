const mongoose = require('mongoose');

const ResponseSchema = new Schema({
    doubt: { type: Schema.Types.ObjectId, ref: 'Doubt', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    attachments: [{ url: String, type: String }],
    isByMentor: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});

module.exports = mongoose.model('Response', ResponseSchema);