"use strict";

const express = require("express");
const { requireJsonObject, requireNonEmptyStrings } = require("../middleware/validation");

function createChargingRouter(sessionStore, eventLogger) {
  const router = express.Router();

  router.post("/start", requireJsonObject, requireNonEmptyStrings("ev_id", "charger_id"), (req, res) => {
    const result = sessionStore.startSession({
      evId: req.body.ev_id.trim(),
      chargerId: req.body.charger_id.trim(),
    });
    if (result.error) {
      return res.status(result.statusCode).json({ error: result.error });
    }
    eventLogger.logEvent("charging_start", result.session);
    return res.status(201).json(result.session);
  });

  router.post("/stop", requireJsonObject, requireNonEmptyStrings("session_id"), (req, res) => {
    const result = sessionStore.stopSession(req.body.session_id.trim());
    if (result.error) {
      return res.status(result.statusCode).json({ error: result.error });
    }
    eventLogger.logEvent("charging_stop", result.session);
    return res.status(200).json(result.session);
  });

  return router;
}

module.exports = { createChargingRouter };
