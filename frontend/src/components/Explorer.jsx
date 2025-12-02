// src/components/Explorer.jsx

import React, { useEffect, useState } from "react";
import { RESTCONF_DATA } from "../config";

export default function Explorer({ onSelectPath }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRoot();
  }, []);

  async function loadRoot() {
    setLoading(true);
    setError("");

    try {
      const resp = await fetch(`${RESTCONF_DATA}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      setTree(json);
    } catch (e) {
      setError("Failed to load RESTCONF root: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function renderNode(obj, path = "") {
    if (!obj || typeof obj !== "object") return null;

    return (
      <ul>
        {Object.keys(obj).map((key) => {
          const newPath = `${path}/${key}`;

          return (
            <li key={newPath}>
              <button onClick={() => onSelectPath(newPath)}>{key}</button>

              {typeof obj[key] === "object" && (
                <div style={{ marginLeft: "1rem" }}>
                  {renderNode(obj[key], newPath)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div>
      <h2>RESTCONF Explorer</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {tree ? renderNode(tree, "") : null}
    </div>
  );
}
