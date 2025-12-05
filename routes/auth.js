const express = require("express");
const router = express.Router();
const db = require("../db");
const knex = require("../db");
const bcrypt = require("bcryptjs");

// ---------------------------------------------
// LOGIN PAGE
// ---------------------------------------------
//this renders the login page
router.get("/login", (req, res) => {
    res.render("login", { error_message: "" });
});

// ---------------------------------------------
// LOGIN POST - SECURE WITH BCRYPT
// ---------------------------------------------
//this handles the login form submission
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Look up user in database
        const user = await knex("users")
            .where({ username })
            .first();
        

        // If user not found
        if (!user) {
            return res.render("login", {
                error_message: "Invalid username or password"
            });
        }

        // Compare password with stored hash
        const isValid = await bcrypt.compare(password, user.password_hash);
    

        if (!isValid) {
            return res.render("login", {
                error_message: "Invalid username or password"
            });
        }

        // Save session
        req.session.isLoggedIn = true;
        req.session.user = {
            user_id: user.user_id,
            username: user.username,
            level: user.level,
            email: user.email
        };

        res.redirect("/dashboard");
    //this catches any errors that occur during the login process

    } catch (err) {
        console.error("Login error:", err);
        res.render("login", {
            error_message: "An error occurred during login."
        });
    }
});

// ---------------------------------------------
// REGISTRATION PAGE (MANAGER ONLY)
// ---------------------------------------------
router.get("/register", requireManager, (req, res) => {
    res.render("register", { error_message: "" });
});

// ---------------------------------------------
// CREATE ACCOUNT - MANAGER ONLY
// ---------------------------------------------
router.post("/register", requireManager, async (req, res) => {
    const { username, email, password, level } = req.body;

    try {
        // Check if username already exists
        const existing = await knex("users").where({ username }).first();
        if (existing) {
            return res.render("register", { 
                error_message: "Username already exists."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new user
        await knex("users").insert({
            username,
            email,
            password_hash: hashedPassword,
            level // Manager chooses role
        });

        // Redirect to dashboard after creation
        res.redirect("/dashboard");

    } catch (err) {
        console.error("Registration error:", err);
        res.render("register", {
            error_message: "Error creating account."
        });
    }
});


// ---------------------------------------------
// CREATE ACCOUNT - SECURE WITH BCRYPT
// ---------------------------------------------
router.post("/register", async (req, res) => {
    const { username, email, password, level } = req.body;

    try {
        // Check if username already exists
        const existing = await knex("users").where({ username }).first();
        if (existing) {
            return res.render("register", { 
                error_message: "Username already exists."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await knex("users").insert({
            username,
            email,
            password_hash: hashedPassword,
            level
        });

        // Redirect to login
        res.redirect("/login");

    } catch (err) {
        console.error("Registration error:", err);
        res.render("register", {
            error_message: "Error creating account."
        });
    }
});

// ---------------------------------------------
// LOGOUT
// ---------------------------------------------
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// ---------------------------------------------
// MIDDLEWARE: REQUIRE LOGIN
// ---------------------------------------------
//this middleware ensures the user is logged in
function requireLogin(req, res, next) {
    if (!req.session.isLoggedIn) {
        return res.redirect("/login");
    }
    next();
}

// ---------------------------------------------
// MIDDLEWARE: REQUIRE MANAGER ("M")
// ---------------------------------------------
//this middleware ensures the user is a manager
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
