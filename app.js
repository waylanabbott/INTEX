require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

// Basic middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Routes
app.use("/", require("./routes/auth"));
app.use("/participants", require("./routes/participants"));
app.use("/events", require("./routes/events"));
app.use("/surveys", require("./routes/surveys"));
app.use("/milestones", require("./routes/milestones"));
app.use("/donations", require("./routes/donations"));
app.use("/dashboard", require("./routes/dashboard"));

// Root route
app.get("/", (req, res) => {
  if (req.session.isLoggedIn) {
    return res.render("index", {
      username: req.session.username,
      userLevel: req.session.level,
    });
  }
  res.redirect("/login");
});

// IS 404 requirement
app.get("/tea", (req, res) => {
  res.status(418).send("I'm a teapot ☕");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`INTEX project running on port ${PORT}`);
});
