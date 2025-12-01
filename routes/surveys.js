const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST SURVEYS
// -----------------------------------------------------
router.get("/", requireLogin, async (req, res) => {
    try {
        const surveys = await db("Surveys_3NF").select("*");

        res.render("surveys-list", {
            user: req.session,
            surveys
        });
    } catch (err) {
        console.error("Error loading surveys:", err);
        res.status(500).send("Error loading surveys");
    }
});

// -----------------------------------------------------
// ADD NEW SURVEY
// -----------------------------------------------------
router.get("/edit", requireLogin, async (req, res) => {
    res.render("surveys-edit", {
        mode: "create",
        survey: null,
        user: req.session
    });
});

// -----------------------------------------------------
// EDIT EXISTING SURVEY
// -----------------------------------------------------
router.get("/edit/:id", requireLogin, async (req, res) => {
    const id = req.params.id;

    try {
        const survey = await db("Surveys_3NF")
            .where("SurveyID", id)
            .first();

        if (!survey) {
            return res.status(404).send("Survey not found");
        }

        res.render("surveys-edit", {
            mode: "edit",
            survey,
            user: req.session
        });
    } catch (err) {
        console.error("Error loading survey:", err);
        res.status(500).send("Error loading survey");
    }
});

// -----------------------------------------------------
// SAVE SURVEY (CREATE OR UPDATE)
// -----------------------------------------------------
router.post("/save", requireManager, async (req, res) => {
    try {
        const {
            SurveyID,
            ParticipantEmail,
            EventName,
            EventOccurrenceID,
            SurveyDate,
            SatisfactionScore,
            LearningScore,
            ConfidenceScore,
            Comments
        } = req.body;

        if (SurveyID && SurveyID.trim() !== "") {
            // UPDATE
            await db("Surveys_3NF")
                .where("SurveyID", SurveyID)
                .update({
                    ParticipantEmail,
                    EventName,
                    EventOccurrenceID,
                    SurveyDate,
                    SatisfactionScore,
                    LearningScore,
                    ConfidenceScore,
                    Comments
                });
        } else {
            // INSERT
            await db("Surveys_3NF").insert({
                ParticipantEmail,
                EventName,
                EventOccurrenceID,
                SurveyDate,
                SatisfactionScore,
                LearningScore,
                ConfidenceScore,
                Comments
            });
        }

        res.redirect("/surveys");
    } catch (err) {
        console.error("Error saving survey:", err);
        res.status(500).send("Error saving survey");
    }
});

// -----------------------------------------------------
// DELETE SURVEY
// -----------------------------------------------------
router.post("/delete/:id", requireManager, async (req, res) => {
    const id = req.params.id;

    try {
        await db("Surveys_3NF")
            .where("SurveyID", id)
            .del();

        res.redirect("/surveys");
    } catch (err) {
        console.error("Error deleting survey:", err);
        res.status(500).send("Error deleting survey");
    }
});

module.exports = router;
