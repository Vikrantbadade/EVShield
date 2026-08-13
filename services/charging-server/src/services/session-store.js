"use strict";

const { randomUUID } = require("crypto");

class SessionStore {
  constructor() {
    this.activeSessionsById = new Map();
    this.activeSessionIdByEvAndCharger = new Map();
  }

  sessionKey(evId, chargerId) {
    return `${evId}\u0000${chargerId}`;
  }

  startSession({ evId, chargerId }) {
    const key = this.sessionKey(evId, chargerId);
    if (this.activeSessionIdByEvAndCharger.has(key)) {
      return { error: "An active charging session already exists for this EV and charger.", statusCode: 409 };
    }

    const session = {
      session_id: randomUUID(),
      ev_id: evId,
      charger_id: chargerId,
      status: "charging",
      started_at: new Date().toISOString(),
    };
    this.activeSessionsById.set(session.session_id, session);
    this.activeSessionIdByEvAndCharger.set(key, session.session_id);
    return { session };
  }

  stopSession(sessionId) {
    const session = this.activeSessionsById.get(sessionId);
    if (!session) {
      return { error: "Charging session not found.", statusCode: 404 };
    }

    this.activeSessionsById.delete(sessionId);
    this.activeSessionIdByEvAndCharger.delete(this.sessionKey(session.ev_id, session.charger_id));
    return {
      session: {
        ...session,
        status: "stopped",
        stopped_at: new Date().toISOString(),
      },
    };
  }

  activeSessionCount() {
    return this.activeSessionsById.size;
  }
}

module.exports = { SessionStore };
