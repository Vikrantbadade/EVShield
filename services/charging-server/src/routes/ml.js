"use strict";

const express = require("express");
const { predict } = require("../services/ml-adapter");

const router = express.Router();

// POST /api/ml/predict
router.post("/predict", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Request body must be a JSON object with feature fields." });
    }
    const result = await predict(req.body);
    res.json(result);
  } catch (error) {
    console.error("ML prediction failed:", error && error.message ? error.message : error);

    res.status(500).json({
      error: "ML prediction failed",
      message: error && error.message ? error.message : String(error),
    });
  }
});

// Optional demo telemetry endpoint: GET /api/ml/telemetry
// Returns a small sample telemetry object that the UI can POST to /api/ml/predict.
router.get("/telemetry", (req, res) => {
  const sample = {
    count: 14,
    mean: 2.496428571428571,
    max: 3.26,
    sum: 34.95,
    std: 0.3929123337855613,
    min: 1.96,
    median: 2.47,
    q1: 2.15,
    q3: 2.7275,
    iqr: 0.5775
  };
  res.json(sample);
});

module.exports = router;
