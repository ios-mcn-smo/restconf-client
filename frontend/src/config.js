// src/config.js

const BASE_URL =
  process.env.REACT_APP_RESTCONF_BASE_URL || "http://localhost:9000";

export const RESTCONF_DATA = `${BASE_URL}/restconf/data`;
export const RESTCONF_NOTIF = `${BASE_URL}/restconf/operations`;
