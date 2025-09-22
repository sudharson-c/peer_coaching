const mongoose = require("mongoose");

const DoubtSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'Response' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Doubt", DoubtSchema);