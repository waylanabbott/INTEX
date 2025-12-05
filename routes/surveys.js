const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST + SEARCH SURVEYS (Schema Safe)
// -----------------------------------------------------
router.get("/", requireLogin, async (req, res) => {
    try {
        let query = db("Surveys_3NF");

        if (req.query.search) {
            const term = `%${req.query.search}%`;

            query.whereRaw('CAST("SurveyID" AS TEXT) ILIKE ?', [term])
                .orWhere("ParticipantEmail", "ilike", term)
                .orWhere("EventName", "ilike", term)
                .orWhereRaw('CAST("EventDateTimeStart" AS TEXT) ILIKE ?', [term])
                .orWhereRaw('CAST("SurveySubmissionDate" AS TEXT) ILIKE ?', [term])
                .orWhere("SurveyNPSBucket", "ilike", term)
                .orWhere("SurveyComments", "ilike", term)
                .orWhereRaw('CAST("SurveySatisfactionScore" AS TEXT) ILIKE ?', [term])
                .orWhereRaw('CAST("SurveyUsefulnessScore" AS TEXT) ILIKE ?', [term])
                .orWhereRaw('CAST("SurveyInstructorScore" AS TEXT) ILIKE ?', [term])
                .orWhereRaw('CAST("SurveyRecommendationScore" AS TEXT) ILIKE ?', [term])
                .orWhereRaw('CAST("SurveyOverallScore" AS TEXT) ILIKE ?', [term]);
        }

        const surveys = await query.select("*");

        res.render("surveys-list", {
            surveys,
            search: req.query.search || "",
            clearPath: "/surveys"
            // ✅ user comes from res.locals.user
        });

    } catch (err) {
        console.error("Survey search error:", err);
        res.status(500).send("Error loading surveys");
    }
});

// -----------------------------------------------------
// ADD NEW SURVEY (Manager Only)
// -----------------------------------------------------
router.get("/edit", requireManager, (req, res) => {
    res.render("surveys-edit", {
        mode: "create",
        survey: null
        // ✅ user comes from res.locals.user
    });
});

// -----------------------------------------------------
// EDIT SURVEY (Manager Only)
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
            survey
            // ✅ user comes from res.locals.user
        });

    } catch (err) {
        console.error("Error loading survey:", err);
        res.status(500).send("Error loading survey");
    }
});

// -----------------------------------------------------
// SAVE SURVEY (CREATE OR UPDATE) — Manager Only
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

        function fixDateTime(datetimeStr) {
            if (!datetimeStr) return null;

            const parts = datetimeStr.split("T");
            if (parts.length < 2) return datetimeStr;

            const [year, month, day] = parts[0].split("-");
            const timePart = parts[1];

            const cleanMonth = parseInt(month, 10);
            const cleanDay = day;

            return `${cleanMonth}/${cleanDay}/${year} ${timePart}`;
        }

        const fixedEventDateTimeStart = fixDateTime(EventDateTimeStart);

        const data = {
            ParticipantEmail,
            EventName,
            EventDateTimeStart: fixedEventDateTimeStart,
            SurveySatisfactionScore: SurveySatisfactionScore ? parseFloat(SurveySatisfactionScore) : null,
            SurveyUsefulnessScore: SurveyUsefulnessScore ? parseFloat(SurveyUsefulnessScore) : null,
            SurveyInstructorScore: SurveyInstructorScore ? parseFloat(SurveyInstructorScore) : null,
            SurveyRecommendationScore: SurveyRecommendationScore ? parseFloat(SurveyRecommendationScore) : null,
            SurveyOverallScore: SurveyOverallScore ? parseFloat(SurveyOverallScore) : null,
            SurveyNPSBucket,
            SurveyComments
        };

        if (SurveyID && SurveyID.trim() !== "") {
            await db("Surveys_3NF")
                .where("SurveyID", SurveyID)
                .update(data);
        } else {
            await db("Surveys_3NF").insert(data);
        }

        res.redirect("/surveys");

    } catch (err) {
        console.error("Error saving survey:", err);
        res.status(500).send("Error saving survey");
    }
});

// -----------------------------------------------------
// DELETE SURVEY — Manager Only
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
