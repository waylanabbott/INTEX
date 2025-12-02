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
            user: req.session,   // FIXED
            surveys
        });
    } catch (err) {
        console.error("Error loading surveys:", err);
        res.status(500).send("Error loading surveys");
    }
});

// -----------------------------------------------------
// ADD NEW (Manager Only)
// -----------------------------------------------------
router.get("/edit", requireManager, (req, res) => {
    res.render("surveys-edit", {
        mode: "create",
        survey: null,
        user: req.session   // FIXED
    });
});

// -----------------------------------------------------
// EDIT (Manager Only)
// -----------------------------------------------------
router.get("/edit/:id", requireManager, async (req, res) => {
    const { id } = req.params;

    try {
        const survey = await db("Surveys_3NF")
            .where("SurveyID", id)
            .first();

        if (!survey) return res.status(404).send("Survey not found");

        res.render("surveys-edit", {
            mode: "edit",
            survey,
            user: req.session   // FIXED
        });

    } catch (err) {
        console.error("Error loading survey:", err);
        res.status(500).send("Error loading survey");
    }
});

// -----------------------------------------------------
// SAVE (CREATE OR UPDATE) — Manager Only
// -----------------------------------------------------
router.post("/save", requireManager, async (req, res) => {
    try {
        const {
            SurveyID,
            ParticipantEmail,
            EventName,
            EventDateTimeStart,
            SurveySatisfactionScore,
            SurveyUsefulnessScore,
            SurveyInstructorScore,
            SurveyRecommendationScore,
            SurveyOverallScore,
            SurveyNPSBucket,
            SurveyComments
        } = req.body;

        const data = {
            ParticipantEmail,
            EventName,
            EventDateTimeStart,
            SurveySatisfactionScore,
            SurveyUsefulnessScore,
            SurveyInstructorScore,
            SurveyRecommendationScore,
            SurveyOverallScore,
            SurveyNPSBucket,
            SurveyComments
        };

        if (SurveyID && SurveyID.trim() !== "") {
            // UPDATE
            await db("Surveys_3NF")
                .where("SurveyID", SurveyID)
                .update(data);
        } else {
            // INSERT
            await db("Surveys_3NF").insert(data);
        }

        res.redirect("/surveys");

    } catch (err) {
        console.error("Error saving survey:", err);
        res.status(500).send("Error saving survey");
    }
});

// -----------------------------------------------------
// DELETE — Manager Only
// -----------------------------------------------------
router.post("/delete/:id", requireManager, async (req, res) => {
    const { id } = req.params;

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
