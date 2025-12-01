const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// LIST DONATIONS
router.get("/", requireLogin, async (req, res) => {
    try {
        const donations = await db("Donations_3NF").select("*");

        res.render("donations-list", {
            user: req.session,
            donations
        });
    } catch (err) {
        console.error("Error loading donations:", err);
        res.status(500).send("Error loading donations");
    }
});

// ADD DONATION
router.get("/edit", requireLogin, (req, res) => {
    res.render("donations-edit", {
        mode: "create",
        donation: null,
        user: req.session
    });
});

// EDIT DONATION
router.get("/edit/:email/:date", requireLogin, async (req, res) => {
    const { email, date } = req.params;

    try {
        const donation = await db("Donations_3NF")
            .where("ParticipantEmail", email)
            .andWhere("Donation Date", date)
            .first();

        if (!donation) return res.status(404).send("Donation not found");

        res.render("donations-edit", {
            mode: "edit",
            donation,
            user: req.session
        });
    } catch (err) {
        console.error("Error loading donation:", err);
        res.status(500).send("Error loading donation");
    }
});

// SAVE DONATION
router.post("/save", requireManager, async (req, res) => {
    try {
        const {
            OriginalEmail,
            OriginalDate,
            ParticipantEmail,
            DonationDate,
            DonationAmount
        } = req.body;

        // Strip leading '$'
        const cleanAmount = DonationAmount.replace("$", "").trim();

        if (OriginalEmail) {
            // UPDATE
            await db("Donations_3NF")
                .where("ParticipantEmail", OriginalEmail)
                .andWhere("Donation Date", OriginalDate)
                .update({
                    ParticipantEmail,
                    "Donation Date": DonationDate,
                    "Donation Amount": cleanAmount
                });
        } else {
            // INSERT
            await db("Donations_3NF").insert({
                ParticipantEmail,
                "Donation Date": DonationDate,
                "Donation Amount": cleanAmount
            });
        }

        res.redirect("/donations");
    } catch (err) {
        console.error("Error saving donation:", err);
        res.status(500).send("Error saving donation");
    }
});

// DELETE DONATION
router.post("/delete/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        await db("Donations_3NF")
            .where("ParticipantEmail", email)
            .andWhere("Donation Date", date)
            .del();

        res.redirect("/donations");
    } catch (err) {
        console.error("Error deleting donation:", err);
        res.status(500).send("Error deleting donation");
    }
});

module.exports = router;
