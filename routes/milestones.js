const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST MILESTONES
// -----------------------------------------------------
router.get("/", requireLogin, async (req, res) => {
    try {
        const milestones = await db("Milestones_3NF").select("*");

        res.render("milestones-list", {
            user: req.session.user,   // ✅ FIXED
            milestones
        });
    } catch (err) {
        console.error("Error loading milestones:", err);
        res.status(500).send("Error loading milestones");
    }
});

// -----------------------------------------------------
// ADD MILESTONE (Manager Only)
// -----------------------------------------------------
router.get("/edit", requireManager, (req, res) => {
    res.render("milestones-edit", {
        mode: "create",
        milestone: null,
        user: req.session.user   // ✅ FIXED
    });
});

// -----------------------------------------------------
// EDIT (Manager Only)
// -----------------------------------------------------
router.get("/edit/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        const milestone = await db("Milestones_3NF")
            .where("ParticipantEmail", email)
            .andWhere("MilestoneDate", date)   // ✅ FIXED column name
            .first();

        if (!milestone) return res.status(404).send("Milestone not found");

        res.render("milestones-edit", {
            mode: "edit",
            milestone,
            user: req.session.user   // ✅ FIXED
        });

    } catch (err) {
        console.error("Error loading milestone:", err);
        res.status(500).send("Error loading milestone");
    }
});

// -----------------------------------------------------
// SAVE (CREATE OR UPDATE — Manager Only)
// -----------------------------------------------------
router.post("/save", requireManager, async (req, res) => {
    try {
        const {
            OriginalEmail,
            OriginalDate,
            ParticipantEmail,
            MilestoneTitle,
            MilestoneDate
        } = req.body;

        if (OriginalEmail) {
            // UPDATE
            await db("Milestones_3NF")
                .where("ParticipantEmail", OriginalEmail)
                .andWhere("MilestoneDate", OriginalDate)   // ✅ FIXED
                .update({
                    ParticipantEmail,
                    MilestoneTitle,
                    MilestoneDate
                });
        } else {
            // INSERT
            await db("Milestones_3NF").insert({
                ParticipantEmail,
                MilestoneTitle,
                MilestoneDate
            });
        }

        res.redirect("/milestones");

    } catch (err) {
        console.error("Error saving milestone:", err);
        res.status(500).send("Error saving milestone");
    }
});

// -----------------------------------------------------
// DELETE (Manager Only)
// -----------------------------------------------------
router.post("/delete/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        await db("Milestones_3NF")
            .where("ParticipantEmail", email)
            .andWhere("MilestoneDate", date)  // ✅ FIXED
            .del();

        res.redirect("/milestones");

    } catch (err) {
        console.error("Error deleting milestone:", err);
        res.status(500).send("Error deleting milestone");
    }
});

module.exports = router;
