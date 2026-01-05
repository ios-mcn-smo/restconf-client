import React, { useEffect, useState } from "react";
import { RESTCONF_DATA } from "../config";

/*
  RESTCONF Explorer
  - Preserves module-qualified keys (ietf-interfaces:interfaces)
  - Builds RESTCONF paths correctly
  - Uses list key=value instead of array indexes
  - Strips optional top-level "data" wrapper (RFC 8040 compliant)
*/

function normalizeRoot(json) {
  return json?.data ?? json;
}

function buildTree(data, basePath = "") {
  if (!data || typeof data !== "object") return [];

  return Object.entries(data).map(([key, value]) => {
    const currentPath = basePath
      ? `${basePath}/${key}`
      : key;

    // LIST
    if (Array.isArray(value)) {
      return {
        label: key,
        path: currentPath,
        children: value.map((item) => {
          // Best-effort list key detection
          const listKey =
            item.name ??
            item.id ??
            item.key ??
            Object.values(item)[0];

          const listPath = `${currentPath}=${listKey}`;

          return {
            label: `${key}=${listKey}`,
            path: listPath,
            children: buildTree(item, listPath),
          };
        }),
      };
    }

    // CONTAINER
    if (typeof value === "object") {
      return {
        label: key,
        path: currentPath,
        children: buildTree(value, currentPath),
      };
    }

    // LEAF
    return {
      label: `${key}: ${String(value)}`,
      path: currentPath,
      value,
      isLeaf: true,
    };
  });
}

function TreeNode({ node, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginLeft: "12px" }}>
      <div
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => {
          if (node.children) setExpanded(!expanded);
          onSelect(node.path);
        }}
      >
        {node.children && (expanded ? "▼ " : "▶ ")}
        {node.label}
      </div>

      {expanded &&
        node.children &&
        node.children.map((child, idx) => (
          <TreeNode
            key={idx}
            node={child}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export default function Explorer({ onSelectPath }) {
  const [tree, setTree] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRoot() {
      try {
        const resp = await fetch(RESTCONF_DATA, {
          headers: {
            Accept: "application/yang-data+json",
          },
        });

        if (!resp.ok) {
          throw new Error(`RESTCONF error: ${resp.status}`);
        }

        const json = await resp.json();

        // 🔑 Normalize RFC 8040 "data" wrapper
        const normalized = normalizeRoot(json);

        setTree(buildTree(normalized));
      } catch (err) {
        setError(err.message);
      }
    }

    loadRoot();
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-2 text-sm">
      <h2 className="font-bold mb-2">RESTCONF Explorer</h2>
      {tree.map((node, idx) => (
        <TreeNode
          key={idx}
          node={node}
          onSelect={onSelectPath}
        />
      ))}
    </div>
  );
}

