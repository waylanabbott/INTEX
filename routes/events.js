const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireManager } = require("./auth");

router.get("/", requireLogin, async (req, res) => {
  try {
      let query = db("EventOccurrences_3NF");

      if (req.query.search) {
          const term = `%${req.query.search}%`;
//this is to make sure that the search works even if the schema changes, by casting all fields to text
          query.whereRaw('CAST("EventOccurrenceID" AS TEXT) ILIKE ?', [term])
               .orWhere("EventName", "ilike", term)
               .orWhereRaw('CAST("EventDateTimeStart" AS TEXT) ILIKE ?', [term])
               .orWhere("EventLocation", "ilike", term)
               .orWhereRaw('CAST("EventCapacity" AS TEXT) ILIKE ?', [term]);
      }
//this retrieves the events based on the constructed query
      const events = await query.select("*");

      res.render("events-list", {
          user: req.session,
          events,
          search: req.query.search || "",
          clearPath: "/events"
      });

  } catch (err) {
      console.error("Events search error:", err);
      res.status(500).send("Error loading events");
  }
});

// -----------------------------------------------------
// LIST EVENTS (merged view: templates + occurrences)
// -----------------------------------------------------
//this lists all event occurrences along with their template details
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
//this renders the events list with user session data
    res.render("events-list", {
      user: req.session.user,   // ✅ FIXED
      events
    });
  } catch (err) {
    console.error("Error loading events:", err);
    res.status(500).send("Error loading events");
  }
});

// -----------------------------------------------------
// ADD NEW EVENT OCCURRENCE (Manager Only)
// -----------------------------------------------------
router.get("/edit", requireManager, async (req, res) => {
  try {
    const templates = await db("EventTemplates_3NF")
      .select("*")
      .orderBy("EventName", "asc");
//this renders the event creation form with available templates
    res.render("events-edit", {
      user: req.session.user,   // ✅ FIXED
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
// EDIT EXISTING EVENT OCCURRENCE (Manager Only)
// -----------------------------------------------------
router.get("/edit/:id", requireManager, async (req, res) => {
  const id = req.params.id;

  try {
    const event = await db("EventOccurrences_3NF")
      .where("EventOccurrenceID", id)
      .first();

    if (!event) {
      return res.status(404).send("Event occurrence not found");
    }
//this retrieves event templates for selection in the edit form
    const templates = await db("EventTemplates_3NF")
      .select("*")
      .orderBy("EventName", "asc");

    res.render("events-edit", {
      user: req.session.user,   // ✅ FIXED
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
//this saves or updates an event occurrence based on presence of EventOccurrenceID
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
//this saves or updates an event occurrence based on presence of EventOccurrenceID
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
//this redirects to the events list after saving
    res.redirect("/events");
  } catch (err) {
    console.error("Error saving event occurrence:", err);
    res.status(500).send("Error saving event");
  }
});

// -----------------------------------------------------
// DELETE EVENT OCCURRENCE (Manager Only)
// -----------------------------------------------------
router.post("/delete/:id", requireManager, async (req, res) => {
  const id = req.params.id;
//this deletes the specified event occurrence
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
