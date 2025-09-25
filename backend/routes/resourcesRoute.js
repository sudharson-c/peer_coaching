const authMiddleware = require("../middleware/authMiddleware");
const checkAuth = require("../middleware/roleMiddleware");
const Resources = require("../models/Resources");

const router = require("express").Router();

// GET /resources (simplified)
router.get("/", async (req, res) => {
    try {
        const { q, section, tags, company } = req.query;
        const filter = { approved: true }; // enforce server-side moderation

        if (section) filter.section = section;
        if (company) filter.company = company;

        if (tags) {
            const arr = String(tags).split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
            if (arr.length) filter.tags = { $in: arr };
        }

        if (q && q.trim()) {
            const rx = new RegExp(q.trim(), "i");
            filter.$or = [{ title: rx }, { note: rx }, { section: rx }, { company: rx }];
        }

        const HARD_CAP = 500;
        const items = await Resources.find(filter).sort({ createdAt: -1 }).limit(HARD_CAP);
        return res.json({ success: true, data: items });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, url, note, section, tags = [], company } = req.body;
        if (!title || !url || !section) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        // role gate: mentor or admin can submit
        const role = req.user.role;
        const isMentor = role === "mentor";
        const isAdmin = role === "admin";

        if (!isMentor && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const resource = new Resources({
            title: String(title).trim(),
            url: String(url).trim(),
            note: String(note || "").trim(),
            section,
            tags: Array.isArray(tags) ? tags : [],
            company: company ? String(company).trim() : undefined,
            createdBy: req.user._id,
            approved: isAdmin ? true : false, // mentor submissions require approval
        });

        await resource.save();
        return res.json({ success: true, data: resource });
    } catch (e) {
        if (e.code === 11000 && e.keyPattern && e.keyPattern.url) {
            return res.status(400).json({ success: false, message: "URL already exists" });
        }
        console.error(e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// PATCH /resources/:id (owner can edit until approved, admin can always edit)
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await Resources.findById(id);
        if (!resource) return res.status(404).json({ success: false, message: "Not found" });

        const isOwner = String(resource.createdBy) === String(req.user._id);
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        if (!isAdmin && resource.approved) {
            return res.status(400).json({ success: false, message: "Approved resources can be edited by admin only" });
        }

        const up = {};
        if (req.body.title != null) up.title = String(req.body.title).trim();
        if (req.body.url != null) up.url = String(req.body.url).trim();
        if (req.body.note != null) up.note = String(req.body.note).trim();
        if (req.body.section != null) up.section = req.body.section;
        if (req.body.tags != null) {
            const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
            up.tags = Array.from(new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)));
        }
        if (req.body.company != null) up.company = String(req.body.company).trim();

        Object.assign(resource, up);
        await resource.save();

        return res.json({ success: true, data: resource });
    } catch (e) {
        if (e.code === 11000 && e.keyPattern && e.keyPattern.url) {
            return res.status(400).json({ success: false, message: "URL already exists" });
        }
        console.error(e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// DELETE /resources/:id (owner can delete if not approved; admin can delete any)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await Resources.findById(id);
        if (!resource) return res.status(404).json({ success: false, message: "Not found" });

        const isOwner = String(resource.createdBy) === String(req.user._id);
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        if (!isAdmin && resource.approved) {
            return res.status(400).json({ success: false, message: "Approved resources can be deleted by admin only" });
        }

        await Resources.findByIdAndDelete(id);
        return res.json({ success: true, message: "Deleted" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// POST /resources/:id/approve (admin only)
router.post("/:id/approve", authMiddleware, checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await Resources.findById(id);
        if (!resource) return res.status(404).json({ success: false, message: "Not found" });
        resource.approved = true;
        await resource.save();
        return res.json({ success: true, data: resource });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// POST /resources/:id/click (track opens)
router.post("/:id/click", async (req, res) => {
    try {
        const { id } = req.params;
        await Resources.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
        return res.json({ success: true });
    } catch (e) {
        return res.status(200).json({ success: true }); // non-blocking
    }
});

module.exports = router;