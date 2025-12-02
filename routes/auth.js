const express = require("express");
const router = express.Router();
const knex = require("../db"); // <-- Make sure this matches your folder structure

// ---------------------------------------------
// LOGIN PAGE
// ---------------------------------------------
router.get("/login", (req, res) => {
    res.render("login", { error_message: "" });
});

// ---------------------------------------------
// LOGIN POST - DATABASE AUTH
// ---------------------------------------------
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Look up user in database
        const user = await knex("users")
            .where({ username })
            .first();

        if (!user) {
            return res.render("login", { error_message: "Invalid username or password" });
        }

        // TEMP: Plain-text comparison (update to bcrypt later)
        if (password !== user.password) {
            return res.render("login", { error_message: "Invalid username or password" });
        }

        // Save session in a clean structure
        req.session.isLoggedIn = true;
        req.session.user = {
            username: user.username,
            level: user.level,
            email: user.email
        };

        res.redirect("/");

    } catch (err) {
        console.error("Login error:", err);
        res.render("login", { error_message: "An error occurred logging in." });
    }
});

// ---------------------------------------------
// LOGOUT
// ---------------------------------------------
router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
});

// ---------------------------------------------
// MIDDLEWARE: REQUIRE LOGIN
// ---------------------------------------------
function requireLogin(req, res, next) {
    if (!req.session.isLoggedIn) {
        return res.redirect("/login");
    }
    next();
}

// ---------------------------------------------
// MIDDLEWARE: REQUIRE MANAGER
// ---------------------------------------------
function requireManager(req, res, next) {
    if (!req.session.user || req.session.user.level !== "M") {
        return res.status(403).send("Forbidden: Managers only");
    }
    next();
}

// ---------------------------------------------
// EXPORTS
// ---------------------------------------------
module.exports = router;
module.exports.requireLogin = requireLogin;
module.exports.requireManager = requireManager;
