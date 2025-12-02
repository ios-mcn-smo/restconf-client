// src/components/Editor.jsx

import React, { useEffect, useState } from "react";
import { RESTCONF_DATA } from "../config";

export default function Editor({ path }) {
  const [content, setContent] = useState({});
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (path) loadPath();
  }, [path]);

  async function loadPath() {
    setStatus("");

    try {
      const resp = await fetch(`${RESTCONF_DATA}${path}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json = await resp.json();
      setContent(json);
      setRaw(JSON.stringify(json, null, 2));
    } catch (e) {
      setStatus("Failed to load: " + e.message);
    }
  }

  async function save() {
    setStatus("");

    try {
      const payload = JSON.parse(raw);

      const resp = await fetch(`${RESTCONF_DATA}${path}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/yang-data+json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatus("Saved successfully");
    } catch (e) {
      setStatus("Save failed: " + e.message);
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Editor: {path}</h2>

      <textarea
        style={{ width: "100%", height: "300px" }}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />

      <button onClick={save}>Save</button>

      {status && <p>{status}</p>}
    </div>
  );
}
