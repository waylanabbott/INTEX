const express = require("express");
const router = express.Router();

// ---------------------------------------------
// TEMPORARY HARDCODED USERS FOR DEVELOPMENT
// ---------------------------------------------
const tempUsers = [
    { username: "admin", password: "admin123", level: "M" }, // Manager
    { username: "user", password: "user123", level: "U" }    // Common User
];

// ---------------------------------------------
// LOGIN PAGE
// ---------------------------------------------
router.get("/login", (req, res) => {
    res.render("login", { error_message: "" });
});

// ---------------------------------------------
// LOGIN POST - TEMP AUTH
// ---------------------------------------------
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    const foundUser = tempUsers.find(
        u => u.username === username && u.password === password
    );

    if (!foundUser) {
        return res.render("login", { error_message: "Invalid username or password" });
    }

    // Save session
    req.session.isLoggedIn = true;
    req.session.username = foundUser.username;
    req.session.level = foundUser.level;

    res.redirect("/");
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
    if (req.session.level !== "M") {
        return res.status(403).send("Forbidden: Managers only");
    }
    next();
}

// ---------------------------------------------
// EXPORTS
// ---------------------------------------------
module.exports = router;                // login/logout routes
module.exports.requireLogin = requireLogin;
module.exports.requireManager = requireManager;
