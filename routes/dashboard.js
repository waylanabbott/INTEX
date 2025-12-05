const express = require("express");
const router = express.Router();
const db = require("../db");          
const { requireLogin } = require("./auth");

// -----------------------------------------------------
// DASHBOARD HOME
// -----------------------------------------------------
//this renders the dashboard home page
router.get("/", requireLogin, async (req, res) => {
    
    // Optional stats (example)
    // const participantCount = await db("Participants_3NF").count("* as count");

    res.render("dashboard", {
        user: req.session.user   // ✅ FIXED
        // participantCount: participantCount[0].count   // example future use
    });
});

module.exports = router;
