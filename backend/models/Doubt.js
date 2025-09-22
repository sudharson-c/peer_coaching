const mongoose = require("mongoose");

const DoubtSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Response' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Doubt", DoubtSchema);