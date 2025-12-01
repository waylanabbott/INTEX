const express = require("express");
const router = express.Router();
const { requireLogin, requireManager } = require("./auth");

// LIST
router.get("/", requireLogin, (req, res) => {
    res.render("surveys-list", { user: req.session });
});

// ADD NEW
router.get("/edit", requireLogin, (req, res) => {
    res.render("surveys-edit", { id: null, user: req.session });
});

// EDIT EXISTING
router.get("/edit/:id", requireLogin, (req, res) => {
    res.render("surveys-edit", { id: req.params.id, user: req.session });
});

// SAVE
router.post("/save", requireManager, (req, res) => {
    res.redirect("/surveys");
});

// DELETE
router.post("/delete/:id", requireManager, (req, res) => {
    res.redirect("/surveys");
});

module.exports = router;
