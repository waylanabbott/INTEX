const express = require("express");
const router = express.Router();

// Import middleware correctly
const { requireLogin, requireManager } = require("./auth");

// LIST EVENTS
router.get("/", requireLogin, (req, res) => {
    res.render("events-list", { user: req.session });
});

// ADD NEW EVENT
router.get("/edit", requireLogin, (req, res) => {
    res.render("events-edit", { id: null, user: req.session });
});

// EDIT EXISTING EVENT
router.get("/edit/:id", requireLogin, (req, res) => {
    res.render("events-edit", { id: req.params.id, user: req.session });
});

// SAVE EVENT
router.post("/save", requireManager, (req, res) => {
    res.redirect("/events");
});

// DELETE EVENT
router.post("/delete/:id", requireManager, (req, res) => {
    res.redirect("/events");
});

module.exports = router;
