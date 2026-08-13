"use strict";

const { randomUUID } = require("crypto");
const express = require("express");
const { requireJsonObject, requireNonEmptyStrings } = require("../middleware/validation");

function createAuthRouter(eventLogger) {
  const router = express.Router();

  router.post("/", requireJsonObject, requireNonEmptyStrings("ev_id", "credential"), (req, res) => {
    const authEventId = randomUUID();
    eventLogger.logEvent("authentication", {
      auth_event_id: authEventId,
      ev_id: req.body.ev_id.trim(),
      authorized: true,
      simulated: true,
    });
    res.status(200).json({
      authorized: true,
      auth_event_id: authEventId,
      ev_id: req.body.ev_id.trim(),
    });
  });

  return router;
}

module.exports = { createAuthRouter };
