"use strict";

const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", service: "charging-server" });
});

module.exports = router;
