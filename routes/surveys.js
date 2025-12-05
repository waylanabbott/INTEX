const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");


//this is for searching surveys in a schema-safe way

router.get("/", requireLogin, async (req, res) => {
    try {
        let query = db("Surveys_3NF");

        if (req.query.search) {
            const term = `%${req.query.search}%`;
//this constructs the search query by casting all fields to text to ensure schema safety
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
//this retrieves the surveys based on the constructed query
        const surveys = await query.select("*");

        res.render("surveys-list", {
            user: req.session,
            surveys,
            search: req.query.search || "",
            clearPath: "/surveys"
        });

    } catch (err) {
        console.error("Survey search error:", err);
        res.status(500).send("Error loading surveys");
    }
});


// -----------------------------------------------------
// LIST SURVEYS
// -----------------------------------------------------
//this lists all surveys
router.get("/", requireLogin, async (req, res) => {
    try {
        const surveys = await db("Surveys_3NF").select("*");
//this renders the surveys list with user session data
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
//this renders the page to add a new survey
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
//this renders the edit page for the survey
router.get("/edit/:id", requireManager, async (req, res) => {
    const { id } = req.params;

    try {
        const survey = await db("Surveys_3NF")
            .where("SurveyID", id)
            .first();

        if (!survey) return res.status(404).send("Survey not found");
//this renders the edit form with the survey data
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
//this saves the survey data, either creating a new record or updating an existing one
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
