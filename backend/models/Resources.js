// models/Resource.js
const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        note: { type: String, trim: true },
        section: {
            type: String,
            enum: ["dsa", "os", "cn", "dbms", "system-design", "interview", "company-wise"],
            required: true,
            index: true,
        },
        tags: { type: [String], default: [], index: true },
        company: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        approved: { type: Boolean, default: true, index: true },
        clicks: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Normalize tags before save
ResourceSchema.pre("save", function (next) {
    if (Array.isArray(this.tags)) {
        this.tags = Array.from(new Set(this.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean)));
    }
    if (this.company) this.company = this.company.trim();
    next();
});

module.exports = mongoose.model("Resources", ResourceSchema);
