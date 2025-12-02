// src/App.jsx

import { useState } from "react";
import Explorer from "./components/Explorer";
import Editor from "./components/Editor";
import Notifications from "./components/Notifications";

export default function App() {
  const [selectedPath, setSelectedPath] = useState("");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-1/4 overflow-auto border-r border-gray-300 p-4 bg-white">
        <Explorer onSelectPath={(p) => setSelectedPath(p)} />
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-auto p-4">
        {selectedPath ? (
          <Editor path={selectedPath} />
        ) : (
          <p>Select an item from the Explorer</p>
        )}
      </div>

      {/* Notifications Panel */}
      <div className="w-1/4 overflow-auto border-l border-gray-300 p-4 bg-white">
        <Notifications />
      </div>
    </div>
  );
}
