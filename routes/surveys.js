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
            user: req.session.user,   // ✅ FIXED
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
        user: req.session.user   // ✅ FIXED
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
            user: req.session.user   // ✅ FIXED
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

        // ✅ FIXED FUNCTION
        function fixDateTime(datetimeStr) {
            if (!datetimeStr) return null;

            console.log("Processing datetime:", datetimeStr); 

            // 1. Split at T: "2024-06-23T10:00" -> ["2024-06-23", "10:00"]
            const parts = datetimeStr.split('T');
            if (parts.length < 2) return datetimeStr; 

            const datePart = parts[0]; 
            const timePart = parts[1]; 

            // 2. Split Date: "2024", "06", "23"
            const [year, month, day] = datePart.split('-');

            // 3. Remove leading zero from Month using parseInt
            // "06" becomes 6
            // "12" stays 12
            const cleanMonth = parseInt(month, 10);
            
            // OPTIONAL: If you also need to remove zero from the day (e.g., 05 -> 5)
            // const cleanDay = parseInt(day, 10); 
            // otherwise just use:
            const cleanDay = day;

            // 4. Reassemble: "6/23/2024 10:00"
            const formatted = `${cleanMonth}/${cleanDay}/${year} ${timePart}`;

            console.log("Fixed datetime:", formatted);
            return formatted;
        }

        let fixedEventDateTimeStart = fixDateTime(EventDateTimeStart);

        const data = {
            ParticipantEmail,
            EventName,
            EventDateTimeStart: fixedEventDateTimeStart,
            // CHANGE: Convert strings to Floats (decimals)
            // If the field is empty, store null to avoid "NaN" errors
            SurveySatisfactionScore: SurveySatisfactionScore ? parseFloat(SurveySatisfactionScore) : null,
            SurveyUsefulnessScore: SurveyUsefulnessScore ? parseFloat(SurveyUsefulnessScore) : null,
            SurveyInstructorScore: SurveyInstructorScore ? parseFloat(SurveyInstructorScore) : null,
            SurveyRecommendationScore: SurveyRecommendationScore ? parseFloat(SurveyRecommendationScore) : null,
            SurveyOverallScore: SurveyOverallScore ? parseFloat(SurveyOverallScore) : null,
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
