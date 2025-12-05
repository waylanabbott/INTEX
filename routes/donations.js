const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST + SEARCH DONATIONS (Schema Safe)
// -----------------------------------------------------
// this route allows users to view and search donations
// requireLogin ensures only logged-in users can access it
router.get("/", requireLogin, async (req, res) => {
  try {
      let query = db("Donations_3NF");

      if (req.query.search) {
          const term = `%${req.query.search}%`;

          // schema-safe universal search across donation fields
          query.whereRaw('CAST("DonationID" AS TEXT) ILIKE ?', [term])
               .orWhere("ParticipantEmail", "ilike", term)
               .orWhereRaw('CAST("Donation Date" AS TEXT) ILIKE ?', [term])
               .orWhereRaw('CAST("Donation Amount" AS TEXT) ILIKE ?', [term]);
      }

      // this retrieves the donations based on the constructed query
      const donations = await query.select("*");

      // IMPORTANT:
      // We do NOT pass `user` here anymore
      // The logged-in user is automatically available via res.locals.user
      // This prevents navbar login issues across pages
      res.render("donations-list", {
          donations,
          search: req.query.search || "",
          clearPath: "/donations"
      });

  } catch (err) {
      console.error("Donations search error:", err);
      res.status(500).send("Error loading donations");
  }
});


// -----------------------------------------------------
// ADD DONATION (Manager Only)
// -----------------------------------------------------
// this renders the page to add a new donation
// requireManager ensures only managers can access this page
router.get("/edit", requireManager, (req, res) => {
    res.render("donations-edit", {
        mode: "create",
        donation: null
        // user is automatically available via res.locals.user
    });
});

// -----------------------------------------------------
// EDIT DONATION (Manager Only)
// -----------------------------------------------------
// this renders the edit page for the donation
router.get("/edit/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        const donation = await db("Donations_3NF")
            .where("ParticipantEmail", email)
            .andWhere("Donation Date", date)
            .first();

        if (!donation) return res.status(404).send("Donation not found");

        // this renders the edit form with the donation data
        res.render("donations-edit", {
            mode: "edit",
            donation
            // user is automatically available via res.locals.user
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

    // ✅ Force proper NULL instead of empty string or UNKNOWN_DATE
    const cleanDate = DonationDate && DonationDate.trim() !== ""
      ? DonationDate
      : null;

    // ✅ Strip ALL dollar signs safely
    const cleanAmount = DonationAmount
      ? DonationAmount.replace(/\$/g, "").trim()
      : null;

    if (OriginalEmail) {
      // UPDATE existing donation
      await db("Donations_3NF")
        .where("ParticipantEmail", OriginalEmail)
        .andWhere("Donation Date", OriginalDate)
        .update({
          "ParticipantEmail": ParticipantEmail,
          "Donation Date": cleanDate,
          "Donation Amount": cleanAmount
        });
    } else {
      // INSERT new donation
      await db("Donations_3NF").insert({
        "ParticipantEmail": ParticipantEmail,
        "Donation Date": cleanDate,
        "Donation Amount": cleanAmount
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
            .andWhere("Donation Date", date)
            .del();

        res.redirect("/donations");

    } catch (err) {
        // this handles errors during deletion
        console.error("Error deleting donation:", err);
        res.status(500).send("Error deleting donation");
    }
});

module.exports = router;
