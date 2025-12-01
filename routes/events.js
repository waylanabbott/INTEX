const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

// -----------------------------------------------------
// LIST EVENTS (merged view: templates + occurrences)
// -----------------------------------------------------
router.get("/", requireLogin, async (req, res) => {
  try {
    const events = await db("EventOccurrences_3NF as eo")
      .join("EventTemplates_3NF as et", "eo.EventName", "et.EventName")
      .select(
        "eo.EventOccurrenceID",
        "eo.EventName",
        "et.EventType",
        "et.EventDescription",
        "et.EventRecurrencePattern",
        "et.EventDefaultCapacity",
        "eo.EventDateTimeStart",
        "eo.EventDateTimeEnd",
        "eo.EventLocation",
        "eo.EventCapacity",
        "eo.EventRegistrationDeadline"
      )
      .orderBy("eo.EventDateTimeStart", "asc");

    res.render("events-list", {
      user: req.session,
      events
    });
  } catch (err) {
    console.error("Error loading events:", err);
    res.status(500).send("Error loading events");
  }
});

// -----------------------------------------------------
// ADD NEW EVENT OCCURRENCE
// -----------------------------------------------------
router.get("/edit", requireLogin, async (req, res) => {
  try {
    const templates = await db("EventTemplates_3NF")
      .select("*")
      .orderBy("EventName", "asc");

    res.render("events-edit", {
      user: req.session,
      mode: "create",
      event: null,
      templates
    });
  } catch (err) {
    console.error("Error loading event form:", err);
    res.status(500).send("Error loading event form");
  }
});

// -----------------------------------------------------
// EDIT EXISTING EVENT OCCURRENCE
// -----------------------------------------------------
router.get("/edit/:id", requireLogin, async (req, res) => {
  const id = req.params.id;

  try {
    const event = await db("EventOccurrences_3NF")
      .where("EventOccurrenceID", id)
      .first();

    if (!event) {
      return res.status(404).send("Event occurrence not found");
    }

    const templates = await db("EventTemplates_3NF")
      .select("*")
      .orderBy("EventName", "asc");

    res.render("events-edit", {
      user: req.session,
      mode: "edit",
      event,
      templates
    });
  } catch (err) {
    console.error("Error loading event occurrence:", err);
    res.status(500).send("Error loading event");
  }
});

// -----------------------------------------------------
// SAVE (CREATE OR UPDATE) EVENT OCCURRENCE
// -----------------------------------------------------
router.post("/save", requireManager, async (req, res) => {
  const {
    EventOccurrenceID,
    EventName,
    EventDateTimeStart,
    EventDateTimeEnd,
    EventLocation,
    EventCapacity,
    EventRegistrationDeadline
  } = req.body;

  try {
    if (EventOccurrenceID && EventOccurrenceID.trim() !== "") {
      // UPDATE existing occurrence
      await db("EventOccurrences_3NF")
        .where("EventOccurrenceID", EventOccurrenceID)
        .update({
          EventName,
          EventDateTimeStart,
          EventDateTimeEnd,
          EventLocation,
          EventCapacity,
          EventRegistrationDeadline
        });
    } else {
      // INSERT new occurrence
      await db("EventOccurrences_3NF").insert({
        EventName,
        EventDateTimeStart,
        EventDateTimeEnd,
        EventLocation,
        EventCapacity,
        EventRegistrationDeadline
      });
    }

    res.redirect("/events");
  } catch (err) {
    console.error("Error saving event occurrence:", err);
    res.status(500).send("Error saving event");
  }
});

// -----------------------------------------------------
// DELETE EVENT OCCURRENCE
// -----------------------------------------------------
router.post("/delete/:id", requireManager, async (req, res) => {
  const id = req.params.id;

  try {
    await db("EventOccurrences_3NF")
      .where("EventOccurrenceID", id)
      .del();

    res.redirect("/events");
  } catch (err) {
    console.error("Error deleting event occurrence:", err);
    res.status(500).send("Error deleting event");
  }
});

module.exports = router;
