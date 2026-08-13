"use strict";

function logEvent(eventType, details = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event_type: eventType,
    ...details,
  }));
}

module.exports = { logEvent };
