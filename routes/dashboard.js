const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("dashboard route working");
});

module.exports = router;
