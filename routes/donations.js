const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");
//this is for searching donations in a schema-safe way
router.get("/", requireLogin, async (req, res) => {
  try {
      let query = db("Donations_3NF");

      if (req.query.search) {
          const term = `%${req.query.search}%`;

          query.whereRaw('CAST("DonationID" AS TEXT) ILIKE ?', [term])
               .orWhere("ParticipantEmail", "ilike", term)
               .orWhereRaw('CAST("Donation Date" AS TEXT) ILIKE ?', [term])
               .orWhereRaw('CAST("Donation Amount" AS TEXT) ILIKE ?', [term]);
      }
//this retrieves the donations based on the constructed query
      const donations = await query.select("*");

      res.render("donations-list", {
          user: req.session,
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
// LIST DONATIONS
// -----------------------------------------------------
//this lists all donations
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
//this renders the page to add a new donation
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
//this renders the edit page for the donation
router.get("/edit/:email/:date", requireManager, async (req, res) => {
    const { email, date } = req.params;

    try {
        const donation = await db("Donations_3NF")
            .where("ParticipantEmail", email)
            .andWhere("DonationDate", date)  // ✅ FIXED column name
            .first();

        if (!donation) return res.status(404).send("Donation not found");
//this renders the edit form with the donation data
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
//this saves a new or edited donation
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
          .andWhere("Donation Date", OriginalDate)
          .update({
            "ParticipantEmail": ParticipantEmail,
            "Donation Date": DonationDate,
            "Donation Amount": cleanAmount  // ✅ FIXED: Double quotes + space
          });
      } else {
        // INSERT
        await db("Donations_3NF").insert({
          "ParticipantEmail": ParticipantEmail,
          "Donation Date": DonationDate,
          "Donation Amount": cleanAmount   // ✅ FIXED: Double quotes + space
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
            .andWhere("Donation Date", date)  // ✅ FIXED
            .del();

        res.redirect("/donations");
//this handles errors during deletion
    } catch (err) {
        console.error("Error deleting donation:", err);
        res.status(500).send("Error deleting donation");
    }
});

module.exports = router;
