const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login", { error_message: "" });
});

// Temporary login until DB is finished
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "test" && password === "test") {
    req.session.isLoggedIn = true;
    req.session.username = username;
    req.session.level = "M"; // M=manager, U=user
    return res.redirect("/");
  }

  res.render("login", { error_message: "Invalid username or password" });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = router;


