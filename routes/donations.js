const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST DONATIONS
// -----------------------------------------------------
router.get("/", requireLogin, async (req, res) => {
    try {
        const donations = await db("Donations_3NF").select("*");

        res.render("donations-list", {
            user: req.session.user,   // ✅ FIXED
            donations
        });
    } catch (err) {
        console.error("Error loading donations:", err);
        res.status(500).send("Error loading donations");
    }
});

// -----------------------------------------------------
// ADD DONATION (Manager Only)
// -----------------------------------------------------
router.get("/edit", requireManager, (req, res) => {
    res.render("donations-edit", {
        mode: "create",
        donation: null,
        user: req.session.user   // ✅ FIXED
    });
});

// -----------------------------------------------------
// EDIT DONATION (Manager Only)
// -----------------------------------------------------
router.get("/edit/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        const donation = await db("Donations_3NF")
            .where("ParticipantEmail", email)
            .andWhere("DonationDate", date)  // ✅ FIXED column name
            .first();

        if (!donation) return res.status(404).send("Donation not found");

        res.render("donations-edit", {
            mode: "edit",
            donation,
            user: req.session.user   // ✅ FIXED
        });

    } catch (err) {
        console.error("Error loading donation:", err);
        res.status(500).send("Error loading donation");
    }
});

// -----------------------------------------------------
// SAVE DONATION (Manager Only)
// -----------------------------------------------------
router.post("/save", requireManager, async (req, res) => {
    try {
        const {
            OriginalEmail,
            OriginalDate,
            ParticipantEmail,
            DonationDate,
            DonationAmount
        } = req.body;

        // Remove $ if present
        const cleanAmount = DonationAmount.replace("$", "").trim();

        if (OriginalEmail) {
            // UPDATE
            await db("Donations_3NF")
                .where("ParticipantEmail", OriginalEmail)
                .andWhere("DonationDate", OriginalDate)  // ✅ FIXED
                .update({
                    ParticipantEmail,
                    DonationDate,
                    DonationAmount: cleanAmount   // ✅ FIXED
                });
        } else {
            // INSERT
            await db("Donations_3NF").insert({
                ParticipantEmail,
                DonationDate,
                DonationAmount: cleanAmount   // ✅ FIXED
            });
        }

        res.redirect("/donations");

    } catch (err) {
        console.error("Error saving donation:", err);
        res.status(500).send("Error saving donation");
    }
});

// -----------------------------------------------------
// DELETE DONATION (Manager Only)
// -----------------------------------------------------
router.post("/delete/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        await db("Donations_3NF")
            .where("ParticipantEmail", email)
            .andWhere("DonationDate", date)  // ✅ FIXED
            .del();

        res.redirect("/donations");

    } catch (err) {
        console.error("Error deleting donation:", err);
        res.status(500).send("Error deleting donation");
    }
});

module.exports = router;
