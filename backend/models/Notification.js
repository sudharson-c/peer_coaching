const mongoose = require("mongoose");

const NotificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String },
    message: { type: String },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", NotificationSchema);