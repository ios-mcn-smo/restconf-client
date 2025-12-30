// src/config.js

// Always use same-origin paths.
// Nginx will proxy /restconf/* to the backend.
export const RESTCONF_DATA = "/restconf/data";
export const RESTCONF_NOTIF = "/restconf/operations";
