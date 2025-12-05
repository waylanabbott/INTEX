const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST PARTICIPANTS (universal search - schema safe)
// -----------------------------------------------------
router.get("/", requireLogin, async (req, res) => {
    try {
        const search = req.query.search;
        let query = db("Participants_3NF");

        if (search) {
            const term = `%${search}%`;
//this is to make sure that the search works even if the schema changes, by casting all fields to text
            query = query.where(function () {
                this.whereRaw(`CAST("ParticipantEmail" AS TEXT) ILIKE ?`, [term])
                    .orWhereRaw(`CAST("ParticipantFirstName" AS TEXT) ILIKE ?`, [term])
                    .orWhereRaw(`CAST("ParticipantLastName" AS TEXT) ILIKE ?`, [term])
                    .orWhereRaw(`CAST("ParticipantPhone" AS TEXT) ILIKE ?`, [term])
                    .orWhereRaw(`CAST("ParticipantDOB" AS TEXT) ILIKE ?`, [term])
                    .orWhereRaw(`CAST("ParticipantRole" AS TEXT) ILIKE ?`, [term])
                    .orWhereRaw(`CAST("ParticipantCity" AS TEXT) ILIKE ?`, [term])
                    .orWhereRaw(`CAST("ParticipantState" AS TEXT) ILIKE ?`, [term])
                    .orWhereRaw(`CAST("ParticipantZip" AS TEXT) ILIKE ?`, [term]);
            });
        }
//this retrieves the participants based on the constructed query
        const participants = await query.select("*");

        res.render("participants-list", {
            participants,
            search: req.query.search || ""
        });

    } catch (err) {
        console.error("Error loading participants:", err);
        res.status(500).send("Error loading participants");
    }
});


// -----------------------------------------------------
// ADD PARTICIPANT (Manager Only)
// -----------------------------------------------------
router.get("/edit", requireManager, (req, res) => {
    res.render("participants-edit", {
        mode: "create",
        participant: null
        // user automatically available via res.locals.user
    });
});

// -----------------------------------------------------
// EDIT PARTICIPANT (Manager Only)
// -----------------------------------------------------
router.get("/edit/:email", requireManager, async (req, res) => {
    const email = req.params.email;

    try {
        const participant = await db("Participants_3NF")
            .where("ParticipantEmail", email)
            .first();

        if (!participant) {
            return res.status(404).send("Participant not found.");
        }
//this renders the edit page for the participant
        res.render("participants-edit", {
            mode: "edit",
            participant
            // user automatically available via res.locals.user
        });

    } catch (err) {
        console.error("Error loading participant:", err);
        res.status(500).send("Error loading participant");
    }
});

// -----------------------------------------------------
// SAVE PARTICIPANT (CREATE OR UPDATE — Manager Only)
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

        const data = {
            ParticipantEmail,
            ParticipantFirstName,
            ParticipantLastName,
            ParticipantDOB,
            ParticipantRole,
            ParticipantPhone,
            ParticipantCity,
            ParticipantState,
            ParticipantZip
        };

        if (OriginalEmail) {
            // UPDATE
            await db("Participants_3NF")
                .where("ParticipantEmail", OriginalEmail)
                .update(data);
        } else {
            // INSERT
            await db("Participants_3NF").insert(data);
        }

        res.redirect("/participants");

    } catch (err) {
        console.error("Error saving participant:", err);
        res.status(500).send("Error saving participant.");
    }
});

// -----------------------------------------------------
// DELETE PARTICIPANT (Manager Only)
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
