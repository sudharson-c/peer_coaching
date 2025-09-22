const mongoose = require('mongoose');

const ResponseLikeSchema = new mongoose.Schema({
    response: { type: mongoose.Types.ObjectId, ref: 'Response', index: true, required: true },
    user: { type: mongoose.Types.ObjectId, ref: 'User', index: true, required: true },
}, { timestamps: true });

ResponseLikeSchema.index({ response: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ResponseLike', ResponseLikeSchema);