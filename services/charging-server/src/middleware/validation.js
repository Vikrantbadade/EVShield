"use strict";

function requireJsonObject(req, res, next) {
  if (!req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json." });
  }
  if (!req.body || Array.isArray(req.body) || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body must be a JSON object." });
  }
  return next();
}

function requireNonEmptyStrings(...fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (typeof req.body[field] !== "string" || req.body[field].trim() === "") {
        return res.status(400).json({ error: `${field} is required and must be a non-empty string.` });
      }
    }
    return next();
  };
}

module.exports = { requireJsonObject, requireNonEmptyStrings };
