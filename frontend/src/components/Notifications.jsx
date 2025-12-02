// src/components/Notifications.jsx

import React, { useEffect, useState } from "react";
import { RESTCONF_NOTIF } from "../config";

export default function Notifications() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const url = `${RESTCONF_NOTIF}/notifications/stream`;

    const evtSource = new EventSource(url);

    evtSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        setMessages((prev) => [...prev, msg]);
      } catch {
        setMessages((prev) => [...prev, { raw: e.data }]);
      }
    };

    evtSource.onerror = () => {
      console.error("notification stream error");
    };

    return () => evtSource.close();
  }, []);

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            <pre>{JSON.stringify(m, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
