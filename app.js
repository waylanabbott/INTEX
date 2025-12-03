require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3300;

// EJS + static files
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session
app.use(
    session({
        secret: process.env.SESSION_SECRET || "temp-secret-key",
        resave: false,
        saveUninitialized: false,
    })
);

// -------------------------
// AUTH HELPERS
// -------------------------
function requireLogin(req, res, next) {
    if (!req.session.isLoggedIn) return res.redirect("/login");
    next();
}

function requireManager(req, res, next) {
    if (!req.session.user || req.session.user.level !== "M") {
        return res.status(403).send("Forbidden: Managers only");
    }
    next();
}

// -------------------------
// MAKE USER AVAILABLE IN ALL EJS FILES
// -------------------------
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isLoggedIn = req.session.isLoggedIn || false;
    next();
});

// -------------------------
// ROUTES
// -------------------------
app.use("/", require("./routes/auth"));
app.use("/participants", require("./routes/participants"));
app.use("/events", require("./routes/events"));
app.use("/surveys", require("./routes/surveys"));
app.use("/milestones", require("./routes/milestones"));
app.use("/donations", require("./routes/donations"));
app.use("/dashboard", require("./routes/dashboard"));

// -------------------------
// HOME PAGE
// -------------------------
app.get("/", (req, res) => {
    res.render("landing", {
        user: req.session.user 
    }
    );
});

// -------------------------
// 418 Teapot route
// -------------------------
app.get("/teapot", (req, res) => {
    res.status(418).send("I'm a teapot ☕");
});

// -------------------------
// START SERVER
// -------------------------
app.listen(PORT, () => {
    console.log(`Ella Rises app running at http://localhost:${PORT}`);
});
