"use strict";

const express = require("express");

function createStatusRouter(sessionStore) {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.json({
      station_status: "operational",
      active_session_count: sessionStore.activeSessionCount(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = { createStatusRouter };
