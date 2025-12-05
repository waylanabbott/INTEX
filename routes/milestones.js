const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST + SEARCH MILESTONES (Schema Safe)
// -----------------------------------------------------
// this is for searching milestones in a schema-safe way
router.get("/", requireLogin, async (req, res) => {
    try {
        let query = db("Milestones_3NF");

        if (req.query.search) {
            const term = `%${req.query.search}%`;

            query.whereRaw('CAST("MilestoneID" AS TEXT) ILIKE ?', [term])
                 .orWhere("ParticipantEmail", "ilike", term)
                 .orWhere("Milestone Title", "ilike", term)
                 .orWhereRaw('CAST("Milestone Date" AS TEXT) ILIKE ?', [term]);
        }

        // this retrieves the milestones based on the constructed query
        const milestones = await query.select("*");

        // IMPORTANT:
        // We do NOT pass `user` here anymore.
        // The logged-in user is automatically available via res.locals.user.
        // This prevents navbar login issues across pages.
        res.render("milestones-list", {
            milestones,
            search: req.query.search || "",
            clearPath: "/milestones"
        });

    } catch (err) {
        console.error("Milestones search error:", err);
        res.status(500).send("Error loading milestones");
    }
});


// -----------------------------------------------------
// ADD MILESTONE (Manager Only)
// -----------------------------------------------------
// this renders the page to add a new milestone
router.get("/edit", requireManager, (req, res) => {
    res.render("milestones-edit", {
        mode: "create",
        milestone: null
        // user is automatically available via res.locals.user
    });
});

// -----------------------------------------------------
// EDIT (Manager Only)
// -----------------------------------------------------
// this renders the edit page for a specific milestone
router.get("/edit/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        const milestone = await db("Milestones_3NF")
            .where("ParticipantEmail", email)
            .andWhere("Milestone Date", date)
            .first();

        if (!milestone) return res.status(404).send("Milestone not found");

        // this renders the edit form with the milestone data
        res.render("milestones-edit", {
            mode: "edit",
            milestone
            // user is automatically available via res.locals.user
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

        // Create an object that maps DB Column Names to your Form Variables
        const dbPayload = {
            "ParticipantEmail": ParticipantEmail,
            "Milestone Title": MilestoneTitle,
            "Milestone Date": MilestoneDate
        };

        if (OriginalEmail) {
            // UPDATE
            await db("Milestones_3NF")
                .where("ParticipantEmail", OriginalEmail)
                .andWhere("Milestone Date", OriginalDate)
                .update(dbPayload);
        } else {
            // INSERT
            await db("Milestones_3NF")
                .insert(dbPayload);
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
            .andWhere("Milestone Date", date)
            .del();

        res.redirect("/milestones");

    } catch (err) {
        console.error("Error deleting milestone:", err);
        res.status(500).send("Error deleting milestone");
    }
});

module.exports = router;
