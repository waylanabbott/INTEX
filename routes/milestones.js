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
            user: req.session,
            milestones
        });
    } catch (err) {
        console.error("Error loading milestones:", err);
        res.status(500).send("Error loading milestones");
    }
});

// -----------------------------------------------------
// ADD
// -----------------------------------------------------
router.get("/edit", requireManager, (req, res) => {
    res.render("milestones-edit", {
        mode: "create",
        milestone: null,
        user: req.session
    });
});

// -----------------------------------------------------
// EDIT
// -----------------------------------------------------
router.get("/edit/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;
    try {
        const milestone = await db("Milestones_3NF")
        .where("ParticipantEmail", email)
        .andWhere("Milestone Date", date)
        .first();
        
        if (!milestone) return res.status(404).send("Milestone not found");
        
        res.render("milestones-edit", {
        mode: "edit",
        milestone,
        user: req.session
        });
    } catch (err) {
        console.error("Error loading milestone:", err);
        res.status(500).send("Error loading milestone");
    }
    });

// -----------------------------------------------------
// SAVE
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
                .andWhere("Milestone Date", OriginalDate)
                .update({
                    ParticipantEmail,
                    "Milestone Title": MilestoneTitle,
                    "Milestone Date": MilestoneDate
                });
        } else {
            // INSERT
            await db("Milestones_3NF").insert({
                ParticipantEmail,
                "Milestone Title": MilestoneTitle,
                "Milestone Date": MilestoneDate
            });
        }

        res.redirect("/milestones");
    } catch (err) {
        console.error("Error saving milestone:", err);
        res.status(500).send("Error saving milestone");
    }
});

// -----------------------------------------------------
// DELETE
// -----------------------------------------------------
router.post("/delete/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        await db("Milestones_3NF")
            .where("ParticipantEmail", email)
            .andWhere("Milestone Date", date)
            .del();

        res.redirect("/milestones");
    } catch (err) {
        console.error("Error deleting milestone:", err);
        res.status(500).send("Error deleting milestone");
    }
});

module.exports = router;
