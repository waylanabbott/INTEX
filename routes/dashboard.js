const express = require("express");
const router = express.Router();
const db = require("../db");          // <-- ADDED (safe)
const { requireLogin } = require("./auth");

// Dashboard home
router.get("/", requireLogin, async (req, res) => {
    // You can add stats later like:
    // const participantCount = await db("Participants_3NF").count("ParticipantID");

    res.render("dashboard");
});

module.exports = router;
