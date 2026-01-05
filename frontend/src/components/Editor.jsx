// src/components/Editor.jsx

import React, { useEffect, useState } from "react";
import { RESTCONF_DATA } from "../config";

function buildUrl(base, path) {
  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${cleanBase}/${cleanPath}`;
}

export default function Editor({ path }) {
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (path) loadPath();
  }, [path]);

  async function loadPath() {
    setStatus("");

    try {
      const url = buildUrl(RESTCONF_DATA, path);

      const resp = await fetch(url, {
        headers: {
          Accept: "application/yang-data+json",
        },
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json = await resp.json();
      setRaw(JSON.stringify(json, null, 2));
    } catch (e) {
      setStatus("Failed to load: " + e.message);
    }
  }

  async function save() {
    setStatus("");

    try {
      const payload = JSON.parse(raw);
      const url = buildUrl(RESTCONF_DATA, path);

      const resp = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/yang-data+json",
          Accept: "application/yang-data+json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatus("Saved successfully");
    } catch (e) {
      setStatus("Save failed: " + e.message);
    }
  }

  if (!path) {
    return <div style={{ padding: "1rem" }}>Select a node to edit</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Editor</h2>
      <div style={{ fontSize: "0.9em", marginBottom: "0.5rem" }}>
        Path: <code>{path}</code>
      </div>

      <textarea
        style={{ width: "100%", height: "300px", fontFamily: "monospace" }}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />

      <div style={{ marginTop: "0.5rem" }}>
        <button onClick={save}>Save</button>
      </div>

      {status && <p>{status}</p>}
    </div>
  );
}

