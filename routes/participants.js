const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST PARTICIPANTS
// -----------------------------------------------------
router.get("/", requireLogin, async (req, res) => {
    try {
        const participants = await db("Participants_3NF").select("*");

        res.render("participants-list", {
            user: req.session,
            participants
        });
    } catch (err) {
        console.error("Error loading participants:", err);
        res.status(500).send("Error loading participants");
    }
});

// -----------------------------------------------------
// ADD PARTICIPANT
// -----------------------------------------------------
router.get("/edit", requireLogin, (req, res) => {
    res.render("participants-edit", {
        mode: "create",
        participant: null,
        user: req.session
    });
});

// -----------------------------------------------------
// EDIT PARTICIPANT
// -----------------------------------------------------
router.get("/edit/:email", requireLogin, async (req, res) => {
    const email = req.params.email;

    try {
        const participant = await db("Participants_3NF")
            .where("ParticipantEmail", email)
            .first();

        if (!participant) {
            return res.status(404).send("Participant not found.");
        }

        res.render("participants-edit", {
            mode: "edit",
            participant,
            user: req.session
        });
    } catch (err) {
        console.error("Error loading participant:", err);
        res.status(500).send("Error loading participant");
    }
});

// -----------------------------------------------------
// SAVE PARTICIPANT (CREATE OR UPDATE)
// -----------------------------------------------------
router.post("/save", requireManager, async (req, res) => {
    try {
        const {
            OriginalEmail,
            ParticipantEmail,
            ParticipantFirstName,
            ParticipantLastName,
            ParticipantDOB,
            ParticipantRole,
            ParticipantPhone,
            ParticipantCity,
            ParticipantState,
            ParticipantZip
        } = req.body;

        if (OriginalEmail) {
            // UPDATE
            await db("Participants_3NF")
                .where("ParticipantEmail", OriginalEmail)
                .update({
                    ParticipantEmail,
                    ParticipantFirstName,
                    ParticipantLastName,
                    ParticipantDOB,
                    ParticipantRole,
                    ParticipantPhone,
                    ParticipantCity,
                    ParticipantState,
                    ParticipantZip
                });
        } else {
            // INSERT
            await db("Participants_3NF").insert({
                ParticipantEmail,
                ParticipantFirstName,
                ParticipantLastName,
                ParticipantDOB,
                ParticipantRole,
                ParticipantPhone,
                ParticipantCity,
                ParticipantState,
                ParticipantZip
            });
        }

        res.redirect("/participants");
    } catch (err) {
        console.error("Error saving participant:", err);
        res.status(500).send("Error saving participant.");
    }
});

// -----------------------------------------------------
// DELETE PARTICIPANT
// -----------------------------------------------------
router.post("/delete/:email", requireManager, async (req, res) => {
    const email = req.params.email;

    try {
        await db("Participants_3NF")
            .where("ParticipantEmail", email)
            .del();

        res.redirect("/participants");
    } catch (err) {
        console.error("Error deleting participant:", err);
        res.status(500).send("Error deleting participant.");
    }
});

module.exports = router;
